import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { CreateMoodDto } from './dto/create-mood.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { Mood, MoodType } from './entities/mood.entity';
import { CreateUserMoodDto } from './dto/create-user-mood.dto';
import { UpdateUserMoodDto } from './dto/update-user-mood.dto';
import { UserMoods } from './entities/user-moods.entity';

@Injectable()
export class MoodsService {
  private readonly logger = new Logger(MoodsService.name);

  constructor(
    @InjectRepository(Mood)
    private moodRepository: Repository<Mood>,

    @InjectRepository(UserMoods)
    private userMoodsRepository: Repository<UserMoods>,
  ) {}

  // Mood CRUD operations

  async create(createMoodDto: CreateMoodDto): Promise<Mood> {
    const mood = this.moodRepository.create(createMoodDto);
    return this.moodRepository.save(mood);
  }

  async findAll(
    pagination: { page: number; limit: number },
    filters?: { type?: string; search?: string },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<Mood> = {};

    if (filters?.type) {
      whereClause.type = filters.type as MoodType;
    }

    if (filters?.search) {
      whereClause.name = Like(`%${filters.search}%`);
    }

    const [items, total] = await this.moodRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Mood> {
    const mood = await this.moodRepository.findOne({ where: { id } });
    if (!mood) {
      throw new NotFoundException(`Mood with ID "${id}" not found`);
    }
    return mood;
  }

  async update(id: string, updateMoodDto: UpdateMoodDto): Promise<Mood> {
    const mood = await this.findOne(id);

    // Ensure id in DTO matches the parameter for security
    if (updateMoodDto.id && updateMoodDto.id !== id) {
      throw new BadRequestException('ID mismatch between parameter and body');
    }

    // Update the mood with new values
    Object.assign(mood, updateMoodDto);
    return this.moodRepository.save(mood);
  }

  // User-Mood operations

  async createUserMood(
    createUserMoodDto: CreateUserMoodDto,
  ): Promise<UserMoods> {
    // Check if mood exists
    const mood = await this.moodRepository.findOne({
      where: { id: createUserMoodDto.moodId },
    });
    if (!mood) {
      throw new NotFoundException(
        `Mood with ID "${createUserMoodDto.moodId}" not found`,
      );
    }

    // Check if user already has this mood
    const existingUserMood = await this.userMoodsRepository.findOne({
      where: {
        userId: createUserMoodDto.userId,
        moodId: createUserMoodDto.moodId,
      },
    });

    if (existingUserMood) {
      throw new BadRequestException('User already has this mood');
    }

    // Create and save the new user mood
    const userMood = this.userMoodsRepository.create(createUserMoodDto);
    return this.userMoodsRepository.save(userMood);
  }

  async updateUserMood(
    id: string,
    updateUserMoodDto: UpdateUserMoodDto,
    userId: string,
  ): Promise<UserMoods> {
    const userMood = await this.userMoodsRepository.findOne({
      where: { id },
    });

    if (!userMood) {
      throw new NotFoundException(`User mood with ID "${id}" not found`);
    }

    // Security check - ensure user can only update their own moods
    if (userMood.userId !== userId) {
      throw new ForbiddenException('You can only update your own moods');
    }

    // Ensure id in DTO matches the parameter for security
    if (updateUserMoodDto.id && updateUserMoodDto.id !== id) {
      throw new BadRequestException('ID mismatch between parameter and body');
    }

    // Special handling for "isSelected" - unselect other moods if setting this one to selected
    if (updateUserMoodDto.isSelected === true) {
      await this.userMoodsRepository.update(
        { userId, isSelected: true },
        { isSelected: false },
      );
    }

    // Update the user mood with new values
    Object.assign(userMood, updateUserMoodDto);
    return this.userMoodsRepository.save(userMood);
  }

  async findUserMoodById(id: string, userId: string): Promise<UserMoods> {
    const userMood = await this.userMoodsRepository.findOne({
      where: { id },
      relations: ['mood'],
    });

    if (!userMood) {
      throw new NotFoundException(`User mood with ID "${id}" not found`);
    }

    // Security check - ensure user can only view their own moods
    if (userMood.userId !== userId) {
      throw new ForbiddenException('You can only view your own moods');
    }

    return userMood;
  }

  async findAllUserMoods(
    userId: string,
    pagination: { page: number; limit: number },
    filters?: { type?: string; isActive?: boolean },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<UserMoods> = { userId };

    if (filters?.type) {
      whereClause.acquisitionType = filters.type as MoodType;
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    try {
      const [items, total] = await this.userMoodsRepository.findAndCount({
        where: whereClause,
        relations: ['mood'],
        skip,
        take: limit,
        order: { acquiredAt: 'DESC' },
      });

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
      console.error('Error fetching user moods:', error);
      throw new BadRequestException('Failed to fetch user moods');
    }
  }

  /**
   * Assigns all default moods to a specific user
   * @param userId The ID of the user to assign default moods to
   * @returns Array of created user moods
   */
  async assignDefaultMoodsToUser(userId: string): Promise<UserMoods[]> {
    // 1. Check if user already has any moods assigned
    const existingUserMoods = await this.userMoodsRepository.find({
      where: { userId },
    });

    if (existingUserMoods.length > 0) {
      throw new BadRequestException(
        'User already has moods assigned. This operation is only for new users.',
      );
    }

    // 2. Get all default moods
    const defaultMoods = await this.moodRepository.find({
      where: { type: MoodType.DEFAULT, isActive: true },
    });

    if (defaultMoods.length === 0) {
      throw new NotFoundException('No default moods found in the system.');
    }

    // 3. Create user mood entries for each default mood
    const userMoodEntities = defaultMoods.map((mood) =>
      this.userMoodsRepository.create({
        userId,
        moodId: mood.id,
        acquisitionType: MoodType.DEFAULT,
        isActive: true,
        isSelected: false, // No mood initially selected
      }),
    );

    // 4. Set the first mood as selected
    if (userMoodEntities.length > 0) {
      userMoodEntities[0].isSelected = true;
    }

    try {
      // 5. Save all user moods in a single transaction
      const savedUserMoods =
        await this.userMoodsRepository.save(userMoodEntities);
      this.logger.log(
        `Assigned ${savedUserMoods.length} default moods to user ${userId}`,
      );
      return savedUserMoods;
    } catch (error) {
      this.logger.error(
        `Failed to assign default moods to user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to assign default moods to user. Please try again later.',
      );
    }
  }

  /**
   * Seeds the database with predefined moods:
   * - Default moods: rad, good, meh, bad, awful
   * - Reward type moods (5 moods)
   * - Purchase type moods (5 moods)
   *
   * @returns Summary of the seed operation
   */
  async seedMoods() {
    // Define the moods data with required properties: name, emoji, colour, darkColour, type
    const defaultMoods = [
      {
        name: 'Rad',
        emoji: '🤩',
        colour: '#FFD700',
        darkColour: '#B8860B',
        type: MoodType.DEFAULT,
      },
      {
        name: 'Good',
        emoji: '😁',
        colour: '#98FB98',
        darkColour: '#3CB371',
        type: MoodType.DEFAULT,
      },
      {
        name: 'Meh',
        emoji: '😐',
        colour: '#F5F5DC',
        darkColour: '#BDB76B',
        type: MoodType.DEFAULT,
      },
      {
        name: 'Bad',
        emoji: '😔',
        colour: '#ADD8E6',
        darkColour: '#4682B4',
        type: MoodType.DEFAULT,
      },
      {
        name: 'Awful',
        emoji: '😩',
        colour: '#FFA07A',
        darkColour: '#CD5C5C',
        type: MoodType.DEFAULT,
      },
    ];

    const rewardMoods = [
      {
        name: 'Happy',
        emoji: '😊',
        colour: '#FFC0CB',
        darkColour: '#DB7093',
        type: MoodType.REWARD,
      },
      {
        name: 'Excited',
        emoji: '🤩',
        colour: '#FF69B4',
        darkColour: '#C71585',
        type: MoodType.REWARD,
      },
      {
        name: 'Proud',
        emoji: '🥲',
        colour: '#D8BFD8',
        darkColour: '#9370DB',
        type: MoodType.REWARD,
      },
      {
        name: 'Relaxed',
        emoji: '😌',
        colour: '#E0FFFF',
        darkColour: '#5F9EA0',
        type: MoodType.REWARD,
      },
      {
        name: 'Grateful',
        emoji: '🙏',
        colour: '#F0E68C',
        darkColour: '#DAA520',
        type: MoodType.REWARD,
      },
    ];

    const purchaseMoods = [
      {
        name: 'Energetic',
        emoji: '⚡',
        colour: '#FFFF00',
        darkColour: '#FFD700',
        type: MoodType.PURCHASE,
      },
      {
        name: 'Confident',
        emoji: '💪',
        colour: '#FF7F50',
        darkColour: '#DC143C',
        type: MoodType.PURCHASE,
      },
      {
        name: 'Creative',
        emoji: '🎨',
        colour: '#FF00FF',
        darkColour: '#8B008B',
        type: MoodType.PURCHASE,
      },
      {
        name: 'Focused',
        emoji: '🧠',
        colour: '#00FFFF',
        darkColour: '#008B8B',
        type: MoodType.PURCHASE,
      },
      {
        name: 'Calm',
        emoji: '🧘',
        colour: '#00FF7F',
        darkColour: '#2E8B57',
        type: MoodType.PURCHASE,
      },
    ];

    const allMoods = [...defaultMoods, ...rewardMoods, ...purchaseMoods];

    const results = {
      created: [],
      skipped: [],
    };

    // Process each mood
    for (const moodData of allMoods) {
      // Check if the mood already exists by name and type
      const existingMood = await this.moodRepository.findOne({
        where: {
          name: moodData.name,
          type: moodData.type,
        },
      });

      if (!existingMood) {
        // Create the mood if it doesn't exist
        const newMood = this.moodRepository.create({
          ...moodData,
          isActive: true,
        });
        await this.moodRepository.save(newMood);
        results.created.push(moodData.name);
      } else {
        // Skip if mood already exists
        results.skipped.push(moodData.name);
      }
    }

    return {
      message: 'Mood seeding operation completed successfully',
      createdMoods: results.created.length,
      skippedMoods: results.skipped.length,
      details: {
        created: results.created,
        skipped: results.skipped,
      },
    };
  }
}
