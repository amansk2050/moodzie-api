import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, In } from 'typeorm';
import { ActivityCategory } from './entities/activity-category.entity';
import { ActivitySubCategory } from './entities/activity-sub-category.entity';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { UpdateActivityCategoryDto } from './dto/update-activity-category.dto';
import { CreateActivitySubCategoryDto } from './dto/create-activity-sub-category.dto';
import { UpdateActivitySubCategoryDto } from './dto/update-activity-sub-category.dto';
import { CreateActivitySubCategoryBulkDto } from './dto/create-activity-sub-category-bulk.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(ActivityCategory)
    private readonly activityCategoryRepository: Repository<ActivityCategory>,
    @InjectRepository(ActivitySubCategory)
    private readonly activitySubCategoryRepository: Repository<ActivitySubCategory>,
  ) {}

  /**
   * Create a new activity category
   */
  async createActivityCategory(
    createDto: CreateActivityCategoryDto,
  ): Promise<ActivityCategory> {
    try {
      const category = this.activityCategoryRepository.create(createDto);
      return await this.activityCategoryRepository.save(category);
    } catch (error) {
      this.logger.error(
        `Failed to create activity category: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to create activity category. Please check your input.',
      );
    }
  }

  /**
   * Update an existing activity category
   */
  async updateActivityCategory(
    id: string,
    updateDto: UpdateActivityCategoryDto,
  ): Promise<ActivityCategory> {
    // Ensure the id in the DTO matches the path parameter
    if (updateDto.id && updateDto.id !== id) {
      throw new BadRequestException('ID mismatch between parameter and body');
    }

    const category = await this.findActivityCategoryById(id);

    try {
      // Update the category with new values
      Object.assign(category, updateDto);
      return await this.activityCategoryRepository.save(category);
    } catch (error) {
      this.logger.error(
        `Failed to update activity category: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to update activity category. Please check your input.',
      );
    }
  }

  /**
   * Get all activity categories with pagination and filters
   */
  async findAllActivityCategories(
    pagination: { page: number; limit: number },
    filters?: { search?: string; isActive?: boolean },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<ActivityCategory> = {};

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.search) {
      whereClause.name = Like(`%${filters.search}%`);
    }

    try {
      const [items, total] = await this.activityCategoryRepository.findAndCount(
        {
          where: whereClause,
          skip,
          take: limit,
          order: { createdAt: 'DESC' },
        },
      );

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
        `Failed to fetch activity categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch activity categories',
      );
    }
  }

  /**
   * Get a specific activity category by ID
   */
  async findActivityCategoryById(id: string): Promise<ActivityCategory> {
    const category = await this.activityCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(
        `Activity category with ID "${id}" not found`,
      );
    }

    return category;
  }

  /**
   * Create a new activity sub-category
   */
  async createActivitySubCategory(
    createDto: CreateActivitySubCategoryDto,
  ): Promise<ActivitySubCategory> {
    // Verify that the category exists
    await this.findActivityCategoryById(createDto.categoryId);

    try {
      const subCategory = this.activitySubCategoryRepository.create(createDto);
      return await this.activitySubCategoryRepository.save(subCategory);
    } catch (error) {
      this.logger.error(
        `Failed to create activity sub-category: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to create activity sub-category. Please check your input.',
      );
    }
  }

  /**
   * Create multiple activity sub-categories in bulk
   */
  async createActivitySubCategoriesBulk(
    bulkDto: CreateActivitySubCategoryBulkDto,
  ): Promise<ActivitySubCategory[]> {
    const { subCategories } = bulkDto;

    // Extract unique category IDs to validate them
    const categoryIds = [
      ...new Set(subCategories.map((item) => item.categoryId)),
    ];

    // Verify all categories exist
    try {
      const foundCategories = await this.activityCategoryRepository.find({
        where: { id: In(categoryIds) },
      });

      if (foundCategories.length !== categoryIds.length) {
        throw new BadRequestException('One or more category IDs are invalid');
      }

      // Create and save all sub-categories
      const subCategoryEntities =
        this.activitySubCategoryRepository.create(subCategories);
      return await this.activitySubCategoryRepository.save(subCategoryEntities);
    } catch (error) {
      this.logger.error(
        `Failed to create bulk activity sub-categories: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create activity sub-categories in bulk. Please check your input.',
      );
    }
  }

  /**
   * Update an existing activity sub-category
   */
  async updateActivitySubCategory(
    id: string,
    updateDto: UpdateActivitySubCategoryDto,
  ): Promise<ActivitySubCategory> {
    // Ensure the id in the DTO matches the path parameter
    if (updateDto.id && updateDto.id !== id) {
      throw new BadRequestException('ID mismatch between parameter and body');
    }

    const subCategory = await this.findActivitySubCategoryById(id);

    // If updating categoryId, verify the new category exists
    if (updateDto.categoryId) {
      await this.findActivityCategoryById(updateDto.categoryId);
    }

    try {
      // Update the sub-category with new values
      Object.assign(subCategory, updateDto);
      return await this.activitySubCategoryRepository.save(subCategory);
    } catch (error) {
      this.logger.error(
        `Failed to update activity sub-category: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to update activity sub-category. Please check your input.',
      );
    }
  }

  /**
   * Get all activity sub-categories with pagination and filters
   */
  async findAllActivitySubCategories(
    pagination: { page: number; limit: number },
    filters?: { categoryId?: string; search?: string; isActive?: boolean },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<ActivitySubCategory> = {};

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.search) {
      whereClause.name = Like(`%${filters.search}%`);
    }

    try {
      const [items, total] =
        await this.activitySubCategoryRepository.findAndCount({
          where: whereClause,
          relations: ['category'],
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
    } catch (error) {
      this.logger.error(
        `Failed to fetch activity sub-categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch activity sub-categories',
      );
    }
  }

  /**
   * Get a specific activity sub-category by ID
   */
  async findActivitySubCategoryById(id: string): Promise<ActivitySubCategory> {
    const subCategory = await this.activitySubCategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!subCategory) {
      throw new NotFoundException(
        `Activity sub-category with ID "${id}" not found`,
      );
    }

    return subCategory;
  }

  /**
   * Get all activity sub-categories by category ID
   */
  async findActivitySubCategoriesByCategoryId(
    categoryId: string,
    filters?: { isActive?: boolean },
  ): Promise<ActivitySubCategory[]> {
    // First verify that the category exists
    await this.findActivityCategoryById(categoryId);

    const whereClause: FindOptionsWhere<ActivitySubCategory> = { categoryId };

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    try {
      return await this.activitySubCategoryRepository.find({
        where: whereClause,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch activity sub-categories by category ID: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch activity sub-categories',
      );
    }
  }

  /**
   * Get all activity categories with their subcategories
   *
   * @param filters - Optional filters to apply (isActive)
   * @returns A list of categories with nested subcategories
   */
  async findAllCategoriesWithSubcategories(filters?: { isActive?: boolean }) {
    try {
      // First, get all categories
      const whereClauseCategory: FindOptionsWhere<ActivityCategory> = {};

      if (filters?.isActive !== undefined) {
        whereClauseCategory.isActive = filters.isActive;
      }

      const categories = await this.activityCategoryRepository.find({
        where: whereClauseCategory,
        order: { createdAt: 'DESC' },
      });

      // For each category, get its subcategories
      const result = await Promise.all(
        categories.map(async (category) => {
          const whereClauseSubCategory: FindOptionsWhere<ActivitySubCategory> =
            {
              categoryId: category.id,
            };

          if (filters?.isActive !== undefined) {
            whereClauseSubCategory.isActive = filters.isActive;
          }

          const subCategories = await this.activitySubCategoryRepository.find({
            where: whereClauseSubCategory,
            order: { createdAt: 'DESC' },
          });

          // Return category with its subcategories
          return {
            ...category,
            subCategories,
          };
        }),
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch categories with subcategories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch categories with subcategories',
      );
    }
  }

  /**
   * Seed database with predefined activity categories and subcategories
   *
   * @param overwriteExisting - Whether to delete existing data before seeding
   * @returns Results of the seeding operation
   */
  async seedPredefinedActivities(overwriteExisting = false): Promise<any> {
    try {
      // If overwriteExisting is true, clear existing data
      if (overwriteExisting) {
        this.logger.log(
          'Deleting existing activity categories and subcategories',
        );
        await this.activityCategoryRepository.delete({});
        // Sub-categories will be deleted automatically due to CASCADE
      }

      // Predefined categories
      const categoriesData = [
        {
          name: 'Emotions',
          emoji: '😊',
          description: 'Track your emotional states',
          color: '#FF5733',
          darkColor: '#CC4000',
          subCategories: [
            {
              name: 'Happy',
              emoji: '😊',
              description: 'Feeling joyful and content',
              color: '#FFD700',
              darkColor: '#B8860B',
            },
            {
              name: 'Sad',
              emoji: '😢',
              description: 'Feeling down or blue',
              color: '#4169E1',
              darkColor: '#00008B',
            },
            {
              name: 'Angry',
              emoji: '😠',
              description: 'Feeling frustrated or upset',
              color: '#FF0000',
              darkColor: '#8B0000',
            },
            {
              name: 'Anxious',
              emoji: '😰',
              description: 'Feeling worried or nervous',
              color: '#FF7F50',
              darkColor: '#A0522D',
            },
            {
              name: 'Calm',
              emoji: '😌',
              description: 'Feeling peaceful and relaxed',
              color: '#90EE90',
              darkColor: '#006400',
            },
            {
              name: 'Tired',
              emoji: '😴',
              description: 'Feeling exhausted or sleepy',
              color: '#8A2BE2',
              darkColor: '#4B0082',
            },
          ],
        },
        {
          name: 'Health',
          emoji: '❤️',
          description: 'Track your health activities',
          color: '#32CD32',
          darkColor: '#006400',
          subCategories: [
            {
              name: 'Exercise',
              emoji: '🏃',
              description: 'Physical activities and workouts',
              color: '#FF4500',
              darkColor: '#8B0000',
            },
            {
              name: 'Medication',
              emoji: '💊',
              description: 'Medication intake tracking',
              color: '#1E90FF',
              darkColor: '#00008B',
            },
            {
              name: 'Symptoms',
              emoji: '🤒',
              description: 'Track physical symptoms',
              color: '#FF69B4',
              darkColor: '#8B008B',
            },
            {
              name: 'Doctor Visit',
              emoji: '👨‍⚕️',
              description: 'Medical appointments',
              color: '#FFFFFF',
              darkColor: '#A9A9A9',
            },
            {
              name: 'Water',
              emoji: '💧',
              description: 'Water intake tracking',
              color: '#00BFFF',
              darkColor: '#0000CD',
            },
            {
              name: 'Vitamins',
              emoji: '💉',
              description: 'Vitamin and supplement intake',
              color: '#FF8C00',
              darkColor: '#8B4513',
            },
          ],
        },
        {
          name: 'Food',
          emoji: '🍔',
          description: 'Track your food and nutrition',
          color: '#FFA500',
          darkColor: '#8B4513',
          subCategories: [
            {
              name: 'Breakfast',
              emoji: '🍳',
              description: 'Morning meals',
              color: '#FFFF00',
              darkColor: '#BDB76B',
            },
            {
              name: 'Lunch',
              emoji: '🥗',
              description: 'Midday meals',
              color: '#7CFC00',
              darkColor: '#006400',
            },
            {
              name: 'Dinner',
              emoji: '🍝',
              description: 'Evening meals',
              color: '#FF1493',
              darkColor: '#8B0000',
            },
            {
              name: 'Snack',
              emoji: '🍿',
              description: 'Between-meal eating',
              color: '#D2691E',
              darkColor: '#8B4513',
            },
            {
              name: 'Dessert',
              emoji: '🍰',
              description: 'Sweet treats',
              color: '#FF00FF',
              darkColor: '#8B008B',
            },
            {
              name: 'Drinks',
              emoji: '🥤',
              description: 'Beverages consumed',
              color: '#00FFFF',
              darkColor: '#008B8B',
            },
          ],
        },
        {
          name: 'Sleep',
          emoji: '😴',
          description: 'Track your sleep patterns',
          color: '#9370DB',
          darkColor: '#483D8B',
          subCategories: [
            {
              name: 'Bedtime',
              emoji: '🛌',
              description: 'When you go to bed',
              color: '#191970',
              darkColor: '#000080',
            },
            {
              name: 'Wake Up',
              emoji: '⏰',
              description: 'When you wake up',
              color: '#FFD700',
              darkColor: '#B8860B',
            },
            {
              name: 'Nap',
              emoji: '💤',
              description: 'Short sleep during the day',
              color: '#E6E6FA',
              darkColor: '#6A5ACD',
            },
            {
              name: 'Sleep Quality',
              emoji: '📊',
              description: 'How well you slept',
              color: '#20B2AA',
              darkColor: '#2F4F4F',
            },
            {
              name: 'Dream',
              emoji: '🌙',
              description: 'Dream journal entries',
              color: '#9932CC',
              darkColor: '#4B0082',
            },
            {
              name: 'Insomnia',
              emoji: '👁️',
              description: 'Trouble sleeping',
              color: '#FF6347',
              darkColor: '#8B0000',
            },
          ],
        },
        {
          name: 'Productivity',
          emoji: '📝',
          description: 'Track your work and productivity',
          color: '#4682B4',
          darkColor: '#00008B',
          subCategories: [
            {
              name: 'Work',
              emoji: '💼',
              description: 'Professional tasks',
              color: '#708090',
              darkColor: '#2F4F4F',
            },
            {
              name: 'Study',
              emoji: '📚',
              description: 'Learning activities',
              color: '#FF7F50',
              darkColor: '#A0522D',
            },
            {
              name: 'Hobbies',
              emoji: '🎨',
              description: 'Personal interest activities',
              color: '#7B68EE',
              darkColor: '#483D8B',
            },
            {
              name: 'Meeting',
              emoji: '👥',
              description: 'Group discussions',
              color: '#F0E68C',
              darkColor: '#BDB76B',
            },
            {
              name: 'Project',
              emoji: '🏗️',
              description: 'Personal or work projects',
              color: '#00FA9A',
              darkColor: '#2E8B57',
            },
            {
              name: 'Breaks',
              emoji: '☕',
              description: 'Rest periods',
              color: '#CD853F',
              darkColor: '#8B4513',
            },
          ],
        },
        {
          name: 'Weather',
          emoji: '🌤️',
          description: 'Track weather conditions',
          color: '#87CEEB',
          darkColor: '#4682B4',
          subCategories: [
            {
              name: 'Sunny',
              emoji: '☀️',
              description: 'Clear sunny day',
              color: '#FFFF00',
              darkColor: '#B8860B',
            },
            {
              name: 'Rainy',
              emoji: '🌧️',
              description: 'Precipitation and rain',
              color: '#1E90FF',
              darkColor: '#00008B',
            },
            {
              name: 'Cloudy',
              emoji: '☁️',
              description: 'Overcast conditions',
              color: '#C0C0C0',
              darkColor: '#696969',
            },
            {
              name: 'Stormy',
              emoji: '⛈️',
              description: 'Thunderstorms',
              color: '#4B0082',
              darkColor: '#191970',
            },
            {
              name: 'Snowy',
              emoji: '❄️',
              description: 'Snow and winter conditions',
              color: '#FFFFFF',
              darkColor: '#A9A9A9',
            },
            {
              name: 'Hot',
              emoji: '🔥',
              description: 'High-temperature days',
              color: '#FF4500',
              darkColor: '#8B0000',
            },
          ],
        },
      ];

      const results = {
        categories: [],
        subCategories: [],
      };

      // Create each category and its sub-categories
      for (const categoryData of categoriesData) {
        const { subCategories, ...categoryDetails } = categoryData;

        // Create the category
        const category = await this.createActivityCategory(categoryDetails);
        results.categories.push(category);

        // Create associated subcategories
        for (const subCategoryData of subCategories) {
          const subCategory = await this.createActivitySubCategory({
            ...subCategoryData,
            categoryId: category.id,
          });
          results.subCategories.push(subCategory);
        }
      }

      return {
        message: 'Activities seeded successfully',
        categories: results.categories.length,
        subCategories: results.subCategories.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to seed activities: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to seed predefined activities',
      );
    }
  }
}
