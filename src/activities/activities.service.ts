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
}
