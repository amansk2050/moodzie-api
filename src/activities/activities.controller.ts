import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { UpdateActivityCategoryDto } from './dto/update-activity-category.dto';
import { CreateActivitySubCategoryDto } from './dto/create-activity-sub-category.dto';
import { UpdateActivitySubCategoryDto } from './dto/update-activity-sub-category.dto';
import { CreateActivitySubCategoryBulkDto } from './dto/create-activity-sub-category-bulk.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  private readonly logger = new Logger(ActivitiesController.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Create a new activity category
   *
   * @param createDto - The DTO containing the activity category data
   * @returns The created activity category
   */
  @ApiOperation({ summary: 'Create a new activity category' })
  @ApiBody({ type: CreateActivityCategoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The activity category has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Post('categories')
  async createActivityCategory(@Body() createDto: CreateActivityCategoryDto) {
    try {
      this.logger.log(`Creating new activity category: ${createDto.name}`);
      return await this.activitiesService.createActivityCategory(createDto);
    } catch (error) {
      this.logger.error(
        `Error creating activity category: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the activity category',
      );
    }
  }

  /**
   * Update an existing activity category
   *
   * @param id - The ID of the activity category to update
   * @param updateDto - The DTO containing the updated activity category data
   * @returns The updated activity category
   */
  @ApiOperation({ summary: 'Update an activity category' })
  @ApiParam({ name: 'id', description: 'Activity category ID', type: 'string' })
  @ApiBody({ type: UpdateActivityCategoryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The activity category has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity category not found',
  })
  @Patch('categories/:id')
  async updateActivityCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateActivityCategoryDto,
  ) {
    try {
      this.logger.log(`Updating activity category with ID: ${id}`);
      return await this.activitiesService.updateActivityCategory(id, updateDto);
    } catch (error) {
      this.logger.error(
        `Error updating activity category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all activity categories with pagination and filters
   *
   * @param page - The page number
   * @param limit - The number of items per page
   * @param search - Optional search term to filter by name
   * @param isActive - Optional filter by active status
   * @returns Paginated list of activity categories
   */
  @ApiOperation({ summary: 'Get all activity categories' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The list of activity categories has been successfully retrieved',
  })
  @Get('categories')
  async findAllActivityCategories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    try {
      this.logger.log('Fetching all activity categories with filters');
      const isActiveBoolean = isActive ? isActive === 'true' : undefined;

      return await this.activitiesService.findAllActivityCategories(
        { page: +page, limit: +limit },
        { search, isActive: isActiveBoolean },
      );
    } catch (error) {
      this.logger.error(
        `Error fetching activity categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching activity categories',
      );
    }
  }

  /**
   * Get a specific activity category by ID
   *
   * @param id - The ID of the activity category to retrieve
   * @returns The requested activity category
   */
  @ApiOperation({ summary: 'Get an activity category by ID' })
  @ApiParam({ name: 'id', description: 'Activity category ID', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The activity category has been successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity category not found',
  })
  @Get('categories/:id')
  async findActivityCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.log(`Fetching activity category with ID: ${id}`);
      return await this.activitiesService.findActivityCategoryById(id);
    } catch (error) {
      this.logger.error(
        `Error fetching activity category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new activity sub-category
   *
   * @param createDto - The DTO containing the activity sub-category data
   * @returns The created activity sub-category
   */
  @ApiOperation({ summary: 'Create a new activity sub-category' })
  @ApiBody({ type: CreateActivitySubCategoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The activity sub-category has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent category not found',
  })
  @Post('sub-categories')
  async createActivitySubCategory(
    @Body() createDto: CreateActivitySubCategoryDto,
  ) {
    try {
      this.logger.log(`Creating new activity sub-category: ${createDto.name}`);
      return await this.activitiesService.createActivitySubCategory(createDto);
    } catch (error) {
      this.logger.error(
        `Error creating activity sub-category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create multiple activity sub-categories in bulk
   *
   * @param bulkDto - The DTO containing an array of activity sub-categories to create
   * @returns The created activity sub-categories
   */
  @ApiOperation({ summary: 'Create multiple activity sub-categories in bulk' })
  @ApiBody({ type: CreateActivitySubCategoryBulkDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The activity sub-categories have been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Post('sub-categories/bulk')
  async createActivitySubCategoriesBulk(
    @Body() bulkDto: CreateActivitySubCategoryBulkDto,
  ) {
    try {
      this.logger.log(
        `Creating ${bulkDto.subCategories.length} activity sub-categories in bulk`,
      );
      return await this.activitiesService.createActivitySubCategoriesBulk(
        bulkDto,
      );
    } catch (error) {
      this.logger.error(
        `Error creating activity sub-categories in bulk: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update an existing activity sub-category
   *
   * @param id - The ID of the activity sub-category to update
   * @param updateDto - The DTO containing the updated activity sub-category data
   * @returns The updated activity sub-category
   */
  @ApiOperation({ summary: 'Update an activity sub-category' })
  @ApiParam({
    name: 'id',
    description: 'Activity sub-category ID',
    type: 'string',
  })
  @ApiBody({ type: UpdateActivitySubCategoryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The activity sub-category has been successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity sub-category not found',
  })
  @Patch('sub-categories/:id')
  async updateActivitySubCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateActivitySubCategoryDto,
  ) {
    try {
      this.logger.log(`Updating activity sub-category with ID: ${id}`);
      return await this.activitiesService.updateActivitySubCategory(
        id,
        updateDto,
      );
    } catch (error) {
      this.logger.error(
        `Error updating activity sub-category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all activity sub-categories with pagination and filters
   *
   * @param page - The page number
   * @param limit - The number of items per page
   * @param categoryId - Optional filter by parent category ID
   * @param search - Optional search term to filter by name
   * @param isActive - Optional filter by active status
   * @returns Paginated list of activity sub-categories
   */
  @ApiOperation({ summary: 'Get all activity sub-categories' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The list of activity sub-categories has been successfully retrieved',
  })
  @Get('sub-categories')
  async findAllActivitySubCategories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    try {
      this.logger.log('Fetching all activity sub-categories with filters');
      const isActiveBoolean = isActive ? isActive === 'true' : undefined;

      return await this.activitiesService.findAllActivitySubCategories(
        { page: +page, limit: +limit },
        { categoryId, search, isActive: isActiveBoolean },
      );
    } catch (error) {
      this.logger.error(
        `Error fetching activity sub-categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching activity sub-categories',
      );
    }
  }

  /**
   * Get a specific activity sub-category by ID
   *
   * @param id - The ID of the activity sub-category to retrieve
   * @returns The requested activity sub-category
   */
  @ApiOperation({ summary: 'Get an activity sub-category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Activity sub-category ID',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The activity sub-category has been successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Activity sub-category not found',
  })
  @Get('sub-categories/:id')
  async findActivitySubCategoryById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.log(`Fetching activity sub-category with ID: ${id}`);
      return await this.activitiesService.findActivitySubCategoryById(id);
    } catch (error) {
      this.logger.error(
        `Error fetching activity sub-category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all activity sub-categories belonging to a specific category
   *
   * @param categoryId - The ID of the parent category
   * @param isActive - Optional filter by active status
   * @returns List of activity sub-categories for the specified category
   */
  @ApiOperation({ summary: 'Get all activity sub-categories by category ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID', type: 'string' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The list of activity sub-categories has been successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent category not found',
  })
  @Get('categories/:categoryId/sub-categories')
  async findActivitySubCategoriesByCategoryId(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('isActive') isActive?: string,
  ) {
    try {
      this.logger.log(
        `Fetching all sub-categories for category ID: ${categoryId}`,
      );
      const isActiveBoolean = isActive ? isActive === 'true' : undefined;

      return await this.activitiesService.findActivitySubCategoriesByCategoryId(
        categoryId,
        { isActive: isActiveBoolean },
      );
    } catch (error) {
      this.logger.error(
        `Error fetching sub-categories by category ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
