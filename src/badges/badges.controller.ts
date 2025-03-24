import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Badges')
@Controller('badges')
export class BadgesController {
  private readonly logger = new Logger(BadgesController.name);

  constructor(private readonly badgesService: BadgesService) {}

  /**
   * Create a new badge
   *
   * This endpoint allows creating a new badge in the system that can be later
   * awarded to users for various achievements.
   *
   * @param createBadgeDto - The data for the badge to create
   * @returns The newly created badge
   */
  @ApiOperation({ summary: 'Create a new badge' })
  @ApiBody({ type: CreateBadgeDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The badge has been successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Post()
  async createBadge(@Body() createBadgeDto: CreateBadgeDto) {
    try {
      this.logger.log(`Creating new badge: ${createBadgeDto.name}`);
      return await this.badgesService.createBadge(createBadgeDto);
    } catch (error) {
      this.logger.error(`Error creating badge: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the badge',
      );
    }
  }

  /**
   * Get a badge by its ID
   *
   * Retrieves the details of a specific badge by its unique identifier.
   *
   * @param id - The UUID of the badge to retrieve
   * @returns The requested badge
   */
  @ApiOperation({ summary: 'Get a badge by ID' })
  @ApiParam({
    name: 'id',
    description: 'Badge ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The badge has been successfully retrieved',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Badge not found',
  })
  @Get(':id')
  async getBadgeById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.log(`Fetching badge with ID: ${id}`);
      return await this.badgesService.getBadgeById(id);
    } catch (error) {
      this.logger.error(`Error fetching badge: ${error.message}`, error.stack);
      throw error; // NotFoundException already properly formatted
    }
  }

  /**
   * Get all badges with pagination and filtering
   *
   * Retrieve a paginated list of badges with optional filtering by category,
   * level, active status, and search term.
   *
   * @param page - The page number for pagination
   * @param limit - The number of items per page
   * @param category - Optional filter by badge category
   * @param level - Optional filter by badge level
   * @param isActive - Optional filter by active status
   * @param search - Optional search term for badge name
   * @returns Paginated list of badges
   */
  @ApiOperation({ summary: 'Get badges with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'level', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The list of badges has been successfully retrieved',
  })
  @Get()
  async getBadges(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    try {
      this.logger.log('Fetching badges with filters');

      // Convert string to boolean if provided
      const isActiveBoolean =
        isActive !== undefined ? isActive === 'true' : undefined;

      return await this.badgesService.getBadges(
        { page: +page, limit: +limit },
        { category, level, isActive: isActiveBoolean, search },
      );
    } catch (error) {
      this.logger.error(`Error fetching badges: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while fetching badges',
      );
    }
  }

  /**
   * Award a badge to a user
   *
   * This endpoint assigns a specific badge to a user, typically used
   * when a user completes an achievement or milestone.
   *
   * @param awardBadgeDto - The data containing user ID and badge ID
   * @returns The created user-badge relationship
   */
  @ApiOperation({ summary: 'Award a badge to a user' })
  @ApiBody({ type: AwardBadgeDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The badge has been successfully awarded to the user',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or user already has badge',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Badge not found or is inactive',
  })
  @Post('award')
  async awardBadgeToUser(@Body() awardBadgeDto: AwardBadgeDto) {
    try {
      this.logger.log(
        `Awarding badge ${awardBadgeDto.badgeId} to user ${awardBadgeDto.userId}`,
      );
      return await this.badgesService.awardBadgeToUser(awardBadgeDto);
    } catch (error) {
      this.logger.error(`Error awarding badge: ${error.message}`, error.stack);
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while awarding the badge',
      );
    }
  }

  /**
   * Get all badges for a specific user
   *
   * Retrieves all badges that have been awarded to a specific user.
   *
   * @param userId - The UUID of the user
   * @returns List of badges awarded to the user
   */
  @ApiOperation({ summary: 'Get all badges for a user' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user badges have been successfully retrieved',
  })
  @Get('user/:userId')
  async getUserBadges(@Param('userId', ParseUUIDPipe) userId: string) {
    try {
      this.logger.log(`Fetching badges for user with ID: ${userId}`);
      return await this.badgesService.getUserBadges(userId);
    } catch (error) {
      this.logger.error(
        `Error fetching user badges: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while fetching user badges',
      );
    }
  }
}
