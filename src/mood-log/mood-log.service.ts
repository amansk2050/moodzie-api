import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  In,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { MoodLog } from './entities/mood-log.entity';
import { MoodStreaks } from './entities/mood-streaks.entity';
import { UserMoods } from '../moods/entities/user-moods.entity';
import { ActivityCategory } from '../activities/entities/activity-category.entity';
import { ActivitySubCategory } from '../activities/entities/activity-sub-category.entity';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
import { UpdateMoodLogDto } from './dto/update-mood-log.dto';
import { QueryMoodLogDto, MoodLogSortOrder } from './dto/query-mood-log.dto';
import {
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';

@Injectable()
export class MoodLogService {
  private readonly logger = new Logger(MoodLogService.name);

  constructor(
    @InjectRepository(MoodLog)
    private moodLogRepository: Repository<MoodLog>,

    @InjectRepository(MoodStreaks)
    private moodStreaksRepository: Repository<MoodStreaks>,

    @InjectRepository(UserMoods)
    private userMoodsRepository: Repository<UserMoods>,

    @InjectRepository(ActivityCategory)
    private activityCategoryRepository: Repository<ActivityCategory>,

    @InjectRepository(ActivitySubCategory)
    private activitySubCategoryRepository: Repository<ActivitySubCategory>,
  ) {}

  /**
   * Create a new mood log entry and handle streak updates
   *
   * @param userId - The user creating the log
   * @param createMoodLogDto - The log data
   * @returns The created mood log with relationships
   */
  async createMoodLog(
    user,
    createMoodLogDto: CreateMoodLogDto,
  ): Promise<MoodLog> {
    const userId = user.id;
    // Verify the userMood belongs to the user
    const userMood = await this.userMoodsRepository.findOne({
      where: { moodId: createMoodLogDto.userMoodId, userId },
    });

    if (!userMood) {
      throw new BadRequestException(
        `User mood with ID "${createMoodLogDto.userMoodId}" not found or doesn't belong to you`,
      );
    }

    // Handle categories and subcategories later

    // Create the mood log
    const moodLog = this.moodLogRepository.create({
      userId,
      userMoodId: userMood.id,
      notes: createMoodLogDto.notes,
      moodDate: createMoodLogDto.moodDate
        ? new Date(createMoodLogDto.moodDate)
        : new Date(),
      isPublic: createMoodLogDto.isPublic ?? false,
    });

    // Handle categories and subcategories if provided
    if (createMoodLogDto.categoryIds?.length) {
      const categories = await this.activityCategoryRepository.findBy({
        id: In(createMoodLogDto.categoryIds),
      });
      moodLog.categories = categories;
    }

    if (createMoodLogDto.subCategoryIds?.length) {
      const subCategories = await this.activitySubCategoryRepository.findBy({
        id: In(createMoodLogDto.subCategoryIds),
      });
      moodLog.subCategories = subCategories;
    }

    // Save the mood log
    const savedMoodLog = await this.moodLogRepository.save(moodLog);

    // Update streak information (must be done after saving the log)
    await this.updateUserStreak(userId, savedMoodLog.moodDate);

    // Return the saved log
    return this.findMoodLogById(savedMoodLog.id, userId);
  }

  /**
   * Find a mood log by ID
   *
   * @param id - The mood log ID
   * @param userId - The user's ID for permission checking
   * @returns The mood log with related data
   */
  async findMoodLogById(id: string, userId: string): Promise<MoodLog> {
    const moodLog = await this.moodLogRepository.findOne({
      where: { id },
      relations: ['userMood.mood', 'categories', 'subCategories'],
    });

    if (!moodLog) {
      throw new NotFoundException(`Mood log with ID "${id}" not found`);
    }

    // Check if the log belongs to the user
    if (moodLog.userId !== userId) {
      throw new ForbiddenException('You can only access your own mood logs');
    }

    return moodLog;
  }

  /**
   * Update an existing mood log
   *
   * @param id - The mood log ID
   * @param updateMoodLogDto - The updated log data
   * @param userId - The user's ID for permission checking
   * @returns The updated mood log
   */
  async updateMoodLog(
    id: string,
    updateMoodLogDto: UpdateMoodLogDto,
    userId: string,
  ): Promise<MoodLog> {
    const moodLog = await this.moodLogRepository.findOne({
      where: { id },
      relations: ['categories', 'subCategories'],
    });

    if (!moodLog) {
      throw new NotFoundException(`Mood log with ID "${id}" not found`);
    }

    // Check if the log belongs to the user
    if (moodLog.userId !== userId) {
      throw new ForbiddenException('You can only update your own mood logs');
    }

    // Update fields that can be changed
    if (updateMoodLogDto.notes !== undefined) {
      moodLog.notes = updateMoodLogDto.notes;
    }

    if (updateMoodLogDto.isPublic !== undefined) {
      moodLog.isPublic = updateMoodLogDto.isPublic;
    }

    // Handle user mood change
    if (updateMoodLogDto.userMoodId) {
      const userMood = await this.userMoodsRepository.findOne({
        where: { id: updateMoodLogDto.userMoodId, userId },
      });

      if (!userMood) {
        throw new BadRequestException(
          `User mood with ID "${updateMoodLogDto.userMoodId}" not found or doesn't belong to you`,
        );
      }

      moodLog.userMoodId = updateMoodLogDto.userMoodId;
    }

    // Handle mood date change
    if (updateMoodLogDto.moodDate) {
      moodLog.moodDate = new Date(updateMoodLogDto.moodDate);
    }

    // Handle categories update
    if (updateMoodLogDto.categoryIds) {
      const categories = await this.activityCategoryRepository.findBy({
        id: In(updateMoodLogDto.categoryIds),
        isActive: true,
      });

      if (categories.length !== updateMoodLogDto.categoryIds.length) {
        throw new BadRequestException(
          'One or more activity categories not found or inactive',
        );
      }

      moodLog.categories = categories;
    }

    // Handle sub-categories update
    if (updateMoodLogDto.subCategoryIds) {
      const subCategories = await this.activitySubCategoryRepository.findBy({
        id: In(updateMoodLogDto.subCategoryIds),
        isActive: true,
      });

      if (subCategories.length !== updateMoodLogDto.subCategoryIds.length) {
        throw new BadRequestException(
          'One or more activity sub-categories not found or inactive',
        );
      }

      moodLog.subCategories = subCategories;
    }

    // Save the updated log
    await this.moodLogRepository.save(moodLog);

    // Return the updated log with relations
    return this.findMoodLogById(id, userId);
  }

  /**
   * Find all mood logs for a user with pagination and filtering
   *
   * @param userId - The user's ID
   * @param queryParams - The pagination and filter parameters
   * @returns Paginated list of mood logs
   */
  async findUserMoodLogs(userId: string, queryParams: QueryMoodLogDto) {
    const {
      page,
      limit,
      startDate,
      endDate,
      userMoodId,
      categoryId,
      subCategoryId,
      sortOrder,
      isPublic,
    } = queryParams;
    const skip = (page - 1) * limit;

    // Build query conditions
    const whereClause: FindOptionsWhere<MoodLog> = { userId };

    // Apply date filters if provided
    if (startDate && endDate) {
      whereClause.moodDate = Between(
        startOfDay(new Date(startDate)),
        endOfDay(new Date(endDate)),
      );
    } else if (startDate) {
      whereClause.moodDate = MoreThanOrEqual(startOfDay(new Date(startDate)));
    } else if (endDate) {
      whereClause.moodDate = LessThanOrEqual(endOfDay(new Date(endDate)));
    }

    // Apply other filters
    if (userMoodId) {
      whereClause.userMoodId = userMoodId;
    }

    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic;
    }

    // Execute the main query
    try {
      // Use queryBuilder to handle complex joins for categories and subcategories
      let queryBuilder = this.moodLogRepository
        .createQueryBuilder('moodLog')
        .leftJoinAndSelect('moodLog.userMood', 'userMood')
        .leftJoinAndSelect('userMood.mood', 'mood')
        .leftJoinAndSelect('moodLog.categories', 'categories')
        .leftJoinAndSelect('moodLog.subCategories', 'subCategories')
        .where('moodLog.userId = :userId', { userId });

      // Add date filters
      if (startDate && endDate) {
        queryBuilder = queryBuilder.andWhere(
          'moodLog.moodDate BETWEEN :startDate AND :endDate',
          {
            startDate: startOfDay(new Date(startDate)),
            endDate: endOfDay(new Date(endDate)),
          },
        );
      } else if (startDate) {
        queryBuilder = queryBuilder.andWhere('moodLog.moodDate >= :startDate', {
          startDate: startOfDay(new Date(startDate)),
        });
      } else if (endDate) {
        queryBuilder = queryBuilder.andWhere('moodLog.moodDate <= :endDate', {
          endDate: endOfDay(new Date(endDate)),
        });
      }

      // Add mood filter
      if (userMoodId) {
        queryBuilder = queryBuilder.andWhere(
          'moodLog.userMoodId = :userMoodId',
          {
            userMoodId,
          },
        );
      }

      // Add public/private filter
      if (isPublic !== undefined) {
        queryBuilder = queryBuilder.andWhere('moodLog.isPublic = :isPublic', {
          isPublic,
        });
      }

      // Add category filter
      if (categoryId) {
        queryBuilder = queryBuilder.andWhere('categories.id = :categoryId', {
          categoryId,
        });
      }

      // Add subcategory filter
      if (subCategoryId) {
        queryBuilder = queryBuilder.andWhere(
          'subCategories.id = :subCategoryId',
          { subCategoryId },
        );
      }

      // Apply sorting
      if (sortOrder === MoodLogSortOrder.OLDEST) {
        queryBuilder = queryBuilder.orderBy('moodLog.moodDate', 'ASC');
      } else {
        queryBuilder = queryBuilder.orderBy('moodLog.moodDate', 'DESC');
      }

      // Apply pagination
      queryBuilder = queryBuilder.skip(skip).take(limit);

      // Execute query
      const [items, total] = await queryBuilder.getManyAndCount();

      return {
        items,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching mood logs: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch mood logs');
    }
  }

  /**
   * Get mood statistics by time period (day, week, month)
   *
   * @param userId - The user's ID
   * @param period - The time period (day, week, month)
   * @returns Mood statistics for the requested period
   */
  async getMoodStatsByPeriod(userId: string, period: 'day' | 'week' | 'month') {
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    // Set date range based on period
    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    try {
      // Get logs for the period
      const logs = await this.moodLogRepository.find({
        where: {
          userId,
          moodDate: Between(startDate, endDate),
        },
        relations: ['userMood.mood'],
        order: { moodDate: 'ASC' },
      });

      // Format the results based on period
      let formattedResults = [];

      switch (period) {
        case 'day':
          // Group by hour
          formattedResults = this.groupLogsByHour(logs);
          break;
        case 'week':
          // Group by day
          formattedResults = this.groupLogsByDay(logs, startDate);
          break;
        case 'month':
          // Group by date
          formattedResults = this.groupLogsByDate(logs, startDate, endDate);
          break;
      }

      return {
        period,
        data: formattedResults,
        total: logs.length,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching mood stats: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch mood statistics');
    }
  }

  /**
   * Get mood summary with counts by period
   *
   * @param userId - The user's ID
   * @param period - The time period (day, week, month)
   * @returns Aggregated mood counts for the period
   */
  async getMoodSummary(userId: string, period: 'day' | 'week' | 'month') {
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    // Set date range based on period
    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    try {
      // Get logs for the period
      const logs = await this.moodLogRepository.find({
        where: {
          userId,
          moodDate: Between(startDate, endDate),
        },
        relations: ['userMood.mood'],
      });

      // Prepare summary data
      const summary = {
        period,
        timeRange: {
          start: startDate,
          end: endDate,
        },
        totalLogs: logs.length,
        moodCounts: {},
        // Populate categories for day, week, or month (e.g., hours, days of week, or dates)
        categories: this.getCategoriesForPeriod(period, startDate, endDate),
      };

      // Count occurrences of each mood
      logs.forEach((log) => {
        const moodName = log.userMood.mood.name;
        if (!summary.moodCounts[moodName]) {
          summary.moodCounts[moodName] = {
            count: 0,
            emoji: log.userMood.mood.emoji,
            color: log.userMood.mood.colour,
            percentage: 0,
          };
        }
        summary.moodCounts[moodName].count++;
      });

      // Calculate percentages
      Object.keys(summary.moodCounts).forEach((mood) => {
        summary.moodCounts[mood].percentage =
          logs.length > 0
            ? Math.round((summary.moodCounts[mood].count / logs.length) * 100)
            : 0;
      });

      return summary;
    } catch (error) {
      this.logger.error(
        `Error fetching mood summary: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch mood summary');
    }
  }

  /**
   * Get comprehensive mood info with counts for all user moods
   *
   * @param userId - The user's ID
   * @returns Information about all moods and their usage
   */
  async getMoodsInfo(userId: string) {
    try {
      // Get all user moods
      const userMoods = await this.userMoodsRepository.find({
        where: { userId, isActive: true },
        relations: ['mood'],
      });

      // Get total logs count for stats
      const totalLogs = await this.moodLogRepository.count({
        where: { userId },
      });

      // Get logs count per mood
      const moodInfoPromises = userMoods.map(async (userMood) => {
        const count = await this.moodLogRepository.count({
          where: { userId, userMoodId: userMood.id },
        });

        const lastUsed = await this.moodLogRepository.findOne({
          where: { userId, userMoodId: userMood.id },
          order: { moodDate: 'DESC' },
        });

        return {
          id: userMood.id,
          moodId: userMood.moodId,
          name: userMood.mood.name,
          emoji: userMood.mood.emoji,
          color: userMood.mood.colour,
          darkColor: userMood.mood.darkColour,
          isSelected: userMood.isSelected,
          count,
          percentage: totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0,
          lastUsed: lastUsed?.moodDate || null,
        };
      });

      const moodInfo = await Promise.all(moodInfoPromises);

      return {
        totalLogs,
        moods: moodInfo,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching moods info: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch moods information',
      );
    }
  }

  /**
   * Update user streak information when creating a new mood log
   *
   * @param userId - The user's ID
   * @param logDate - The date of the new mood log
   * @returns The updated streak information
   */
  private async updateUserStreak(
    userId: string,
    logDate: Date,
  ): Promise<MoodStreaks> {
    // Find or create user's streak record
    let streakRecord = await this.moodStreaksRepository.findOne({
      where: { userId },
    });

    const today = startOfDay(logDate);

    if (!streakRecord) {
      // First time logging mood - create new streak record
      streakRecord = this.moodStreaksRepository.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastLogDate: today,
        isActive: true,
        currentStreakStartDate: today,
        longestStreakStartDate: today,
        longestStreakEndDate: today,
      });
    } else {
      // Existing streak - handle streak logic
      const lastLogDate = streakRecord.lastLogDate
        ? startOfDay(streakRecord.lastLogDate)
        : null;

      if (!lastLogDate) {
        // Should not happen but handle it anyway
        streakRecord.currentStreak = 1;
        streakRecord.lastLogDate = today;
        streakRecord.isActive = true;
        streakRecord.currentStreakStartDate = today;
      } else {
        const daysDifference = differenceInCalendarDays(today, lastLogDate);

        if (daysDifference === 0) {
          // Same day - no streak change, just update last log date
          streakRecord.lastLogDate = today;
        } else if (daysDifference === 1) {
          // Next consecutive day - increment streak
          streakRecord.currentStreak += 1;
          streakRecord.lastLogDate = today;
          streakRecord.isActive = true;

          // Update longest streak if current streak is now longer
          if (streakRecord.currentStreak > streakRecord.longestStreak) {
            streakRecord.longestStreak = streakRecord.currentStreak;
            streakRecord.longestStreakStartDate =
              streakRecord.currentStreakStartDate;
            streakRecord.longestStreakEndDate = today;
          }
        } else if (daysDifference > 1) {
          // Streak broken - reset streak to 1
          streakRecord.currentStreak = 1;
          streakRecord.lastLogDate = today;
          streakRecord.currentStreakStartDate = today;
          streakRecord.isActive = true;
        }
      }
    }

    return this.moodStreaksRepository.save(streakRecord);
  }

  /**
   * Group logs by hour for day view
   */
  private groupLogsByHour(logs: MoodLog[]) {
    const hourGroups = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourGroups[i] = {
        hour: i,
        logs: [],
        count: 0,
      };
    }

    // Group logs by hour
    logs.forEach((log) => {
      const hour = log.moodDate.getHours();
      hourGroups[hour].logs.push(log);
      hourGroups[hour].count++;
    });

    return Object.values(hourGroups);
  }

  /**
   * Group logs by day for week view
   */
  private groupLogsByDay(logs: MoodLog[], startDate: Date) {
    interface DayGroup {
      day: string;
      dayNumber: number;
      logs: MoodLog[];
      count: number;
    }

    const dayGroups: Record<number, DayGroup> = {};
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      const day = (startDate.getDay() + i) % 7;
      dayGroups[day] = {
        day: daysOfWeek[day],
        dayNumber: day,
        logs: [],
        count: 0,
      };
    }

    // Group logs by day
    logs.forEach((log) => {
      const day = log.moodDate.getDay();
      dayGroups[day].logs.push(log);
      dayGroups[day].count++;
    });

    return Object.values(dayGroups).sort((a, b) => a.dayNumber - b.dayNumber);
  }

  /**
   * Group logs by date for month view
   */
  private groupLogsByDate(logs: MoodLog[], startDate: Date, endDate: Date) {
    interface DateGroup {
      date: string;
      dateObj: Date;
      logs: MoodLog[];
      count: number;
    }

    const dateGroups: Record<string, DateGroup> = {};
    const numDays = differenceInCalendarDays(endDate, startDate) + 1;

    // Initialize all dates in the month
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dateGroups[dateStr] = {
        date: dateStr,
        dateObj: new Date(date),
        logs: [],
        count: 0,
      };
    }

    // Group logs by date
    logs.forEach((log) => {
      const dateStr = format(log.moodDate, 'yyyy-MM-dd');
      if (dateGroups[dateStr]) {
        dateGroups[dateStr].logs.push(log);
        dateGroups[dateStr].count++;
      }
    });

    return Object.values(dateGroups).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime(),
    );
  }

  /**
   * Get categories for the specified period (hours, days, dates)
   */
  private getCategoriesForPeriod(
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ) {
    switch (period) {
      case 'day':
        return Array.from({ length: 24 }, (_, i) => i);
      case 'week':
        return [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
      case 'month':
        const numDays = differenceInCalendarDays(endDate, startDate) + 1;
        return Array.from({ length: numDays }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          return format(date, 'yyyy-MM-dd');
        });
    }
  }
}
