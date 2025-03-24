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
}
