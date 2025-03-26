import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MoodLogService } from './mood-log.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
import { UpdateMoodLogDto } from './dto/update-mood-log.dto';
import { QueryMoodLogDto } from './dto/query-mood-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Mood Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mood-logs')
export class MoodLogController {
  private readonly logger = new Logger(MoodLogController.name);

  constructor(private readonly moodLogService: MoodLogService) {}

  /**
   * Create a new mood log
   *
   * This endpoint creates a new mood log entry for the authenticated user.
   * It also handles streak tracking, incrementing the streak counter if appropriate.
   *
   * @param user The authenticated user
   * @param createMoodLogDto The data for creating the mood log
   * @returns The created mood log with all relationships
   */
  @ApiOperation({ summary: 'Create a new mood log' })
  @ApiResponse({ status: 201, description: 'Mood log created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post()
  async create(
    @GetUser() user: User,
    @Body() createMoodLogDto: CreateMoodLogDto,
  ) {
    try {
      this.logger.log(`Creating mood log for user ${user.id}`);
      return await this.moodLogService.createMoodLog(user, createMoodLogDto);
    } catch (error) {
      this.logger.error(
        `Error creating mood log: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the mood log',
      );
    }
  }

  /**
   * Get all mood logs for the authenticated user
   *
   * This endpoint retrieves all mood logs for the authenticated user with pagination and filtering options.
   * Results can be filtered by date range, mood, categories, etc.
   *
   * @param user The authenticated user
   * @param queryParams Filter and pagination parameters
   * @returns Paginated list of mood logs
   */
  @ApiOperation({ summary: 'Get mood logs for the current user' })
  @ApiResponse({ status: 200, description: 'Mood logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'userMoodId',
    required: false,
    description: 'Filter by mood ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'subCategoryId',
    required: false,
    description: 'Filter by sub-category ID',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (newest/oldest)',
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: 'Filter by public status',
  })
  @Get()
  async findAll(@GetUser() user: User, @Query() queryParams: QueryMoodLogDto) {
    try {
      this.logger.log(`Fetching mood logs for user ${user.id}`);
      return await this.moodLogService.findUserMoodLogs(user.id, queryParams);
    } catch (error) {
      this.logger.error(
        `Error fetching mood logs: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching mood logs',
      );
    }
  }

  /**
   * Get a specific mood log by ID
   *
   * This endpoint retrieves a single mood log by its ID.
   * The user can only access their own mood logs.
   *
   * @param id The ID of the mood log to retrieve
   * @param user The authenticated user
   * @returns The requested mood log
   */
  @ApiOperation({ summary: 'Get a mood log by ID' })
  @ApiResponse({ status: 200, description: 'Mood log retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your mood log' })
  @ApiResponse({ status: 404, description: 'Mood log not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({ name: 'id', description: 'The ID of the mood log' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      this.logger.log(`Fetching mood log with ID ${id} for user ${user.id}`);
      return await this.moodLogService.findMoodLogById(id, user.id);
    } catch (error) {
      this.logger.error(
        `Error fetching mood log: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while fetching the mood log',
      );
    }
  }

  /**
   * Update a mood log
   *
   * This endpoint updates an existing mood log.
   * Users can only update their own mood logs.
   *
   * @param id The ID of the mood log to update
   * @param updateMoodLogDto The data to update
   * @param user The authenticated user
   * @returns The updated mood log
   */
  @ApiOperation({ summary: 'Update a mood log' })
  @ApiResponse({ status: 200, description: 'Mood log updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your mood log' })
  @ApiResponse({ status: 404, description: 'Mood log not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({ name: 'id', description: 'The ID of the mood log' })
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMoodLogDto: UpdateMoodLogDto,
    @GetUser() user: User,
  ) {
    try {
      this.logger.log(`Updating mood log with ID ${id} for user ${user.id}`);
      return await this.moodLogService.updateMoodLog(
        id,
        updateMoodLogDto,
        user.id,
      );
    } catch (error) {
      this.logger.error(
        `Error updating mood log: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the mood log',
      );
    }
  }

  /**
   * Get comprehensive mood information
   *
   * This endpoint provides detailed information about all moods and their usage statistics.
   * It returns counts, percentages, and last usage dates for each mood.
   *
   * @param user The authenticated user
   * @returns Comprehensive mood statistics
   */
  @ApiOperation({ summary: 'Get mood statistics and information' })
  @ApiResponse({ status: 200, description: 'Mood info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get('moods-info')
  async getMoodsInfo(@GetUser() user: User) {
    try {
      this.logger.log(`Fetching moods info for user ${user.id}`);
      return await this.moodLogService.getMoodsInfo(user.id);
    } catch (error) {
      this.logger.error(
        `Error fetching moods info: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching moods information',
      );
    }
  }

  /**
   * Get detailed mood statistics for a specific time period
   *
   * This endpoint retrieves detailed mood data for day, week, or month periods.
   * It provides a breakdown of moods by time units (hours, days, or dates).
   *
   * @param user The authenticated user
   * @param period The time period (day, week, month)
   * @returns Detailed mood statistics for the specified period
   */
  @ApiOperation({ summary: 'Get detailed mood statistics by time period' })
  @ApiResponse({
    status: 200,
    description: 'Mood statistics retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid period' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({
    name: 'period',
    enum: ['day', 'week', 'month'],
    description: 'Time period',
  })
  @Get('stats/:period')
  async getMoodStats(
    @GetUser() user: User,
    @Param('period') period: 'day' | 'week' | 'month',
  ) {
    // Validate period
    if (!['day', 'week', 'month'].includes(period)) {
      throw new BadRequestException('Period must be one of: day, week, month');
    }

    try {
      this.logger.log(`Fetching mood stats for ${period} for user ${user.id}`);
      return await this.moodLogService.getMoodStatsByPeriod(user.id, period);
    } catch (error) {
      this.logger.error(
        `Error fetching mood stats: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching mood statistics',
      );
    }
  }

  /**
   * Get summarized mood data for a specific time period
   *
   * This endpoint provides a summary of mood data for day, week, or month periods.
   * It includes aggregated counts and percentages for each mood.
   *
   * @param user The authenticated user
   * @param period The time period (day, week, month)
   * @returns Mood summary for the specified period
   */
  @ApiOperation({ summary: 'Get mood summary by time period' })
  @ApiResponse({
    status: 200,
    description: 'Mood summary retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid period' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({
    name: 'period',
    enum: ['day', 'week', 'month'],
    description: 'Time period',
  })
  @Get('summary/:period')
  async getMoodSummary(
    @GetUser() user: User,
    @Param('period') period: 'day' | 'week' | 'month',
  ) {
    // Validate period
    if (!['day', 'week', 'month'].includes(period)) {
      throw new BadRequestException('Period must be one of: day, week, month');
    }

    try {
      this.logger.log(
        `Fetching mood summary for ${period} for user ${user.id}`,
      );
      return await this.moodLogService.getMoodSummary(user.id, period);
    } catch (error) {
      this.logger.error(
        `Error fetching mood summary: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching mood summary',
      );
    }
  }
}
