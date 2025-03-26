import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MoodsService } from './moods.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { UpdateMoodDto } from './dto/update-mood.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/user/guards/roles.guard';
import { Roles } from 'src/user/decorators/roles.decorator';
import { UserRoles } from '../user/enums/role.enum';
import { User } from 'src/user/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateUserMoodDto } from './dto/create-user-mood.dto';
import { UpdateUserMoodDto } from './dto/update-user-mood.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

/**
 * Controller for handling mood-related operations in the application.
 *
 * This controller provides endpoints for managing moods and user-mood assignments.
 * It includes routes for CRUD operations on moods (admin only) and user-mood relationships.
 *
 * Authentication is required for all endpoints via JWT.
 * Role-based access control is implemented for specific operations.
 *
 * @remarks
 * The controller is tagged as 'Moods' in the Swagger documentation.
 * Bearer token authentication is required for all endpoints.
 */
@ApiTags('Moods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('moods')
export class MoodsController {
  private readonly logger = new Logger(MoodsController.name);

  constructor(private readonly moodsService: MoodsService) {}

  /**
   * IMPORTANT: Order of routes matters in NestJS!
   * More specific routes should be defined before more general ones.
   * Reordered the routes to ensure proper matching.
   */

  // User-Mood routes - KEEP THESE FIRST

  @ApiOperation({
    summary: 'Get all moods for a user with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'User moods successfully retrieved',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['default', 'reward', 'purchase'],
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @Get('user-moods') // This needs to come before the :id parameter route
  async getAllUserMoods(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    try {
      const userId = user.id;
      this.logger.log(`Fetching all moods for user: ${userId}`);

      // Convert isActive string to boolean if provided
      const isActiveBoolean = isActive ? isActive === 'true' : undefined;

      return await this.moodsService.findAllUserMoods(
        userId,
        { page: +page, limit: +limit },
        { type, isActive: isActiveBoolean },
      );
    } catch (error) {
      this.logger.error(
        `Error fetching user moods: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while fetching user moods',
      );
    }
  }

  @ApiOperation({ summary: 'Get a user mood by ID' })
  @ApiResponse({ status: 200, description: 'User mood successfully retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot view another user's mood",
  })
  @ApiResponse({ status: 404, description: 'User mood not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @Get('user-moods/:id')
  async findUserMoodById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    try {
      this.logger.log(`Fetching user mood with ID: ${id}`);
      return await this.moodsService.findUserMoodById(id, userId);
    } catch (error) {
      this.logger.error(
        `Error fetching user mood: ${error.message}`,
        error.stack,
      );
      if (error.status === 403 || error.status === 404) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while fetching the user mood',
      );
    }
  }

  @ApiOperation({ summary: 'Assign a mood to a user' })
  @ApiResponse({
    status: 201,
    description: 'Mood successfully assigned to user',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or mood already assigned',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Mood not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles(UserRoles.ADMIN, UserRoles.APP_ADMIN)
  @Post('user-moods')
  async createUserMood(@Body() createUserMoodDto: CreateUserMoodDto) {
    try {
      this.logger.log(
        `Assigning mood ${createUserMoodDto.moodId} to user ${createUserMoodDto.userId}`,
      );
      return await this.moodsService.createUserMood(createUserMoodDto);
    } catch (error) {
      this.logger.error(
        `Error assigning mood to user: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException || error.status === 404) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while assigning the mood to user',
      );
    }
  }

  @ApiOperation({ summary: 'Update a user mood' })
  @ApiResponse({ status: 200, description: 'User mood successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Cannot update another user's mood",
  })
  @ApiResponse({ status: 404, description: 'User mood not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Patch('user-moods/:id')
  async updateUserMood(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserMoodDto: UpdateUserMoodDto,
    @GetUser('id') userId: string,
  ) {
    try {
      this.logger.log(`Updating user mood with ID: ${id}`);
      return await this.moodsService.updateUserMood(
        id,
        updateUserMoodDto,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Error updating user mood: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error.status === 403 ||
        error.status === 404
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the user mood',
      );
    }
  }

  /**
   * Assigns all default moods to the current user
   * This is typically used when a new user registers to set up their initial moods
   */
  @ApiOperation({ summary: 'Assign all default moods to the current user' })
  @ApiResponse({
    status: 201,
    description: 'Default moods successfully assigned to user',
  })
  @ApiResponse({
    status: 400,
    description: 'User already has moods assigned or other validation error',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No default moods found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Post('user-moods/assign-defaults')
  async assignDefaultMoods(@GetUser() user: User) {
    try {
      const userId = user.id;
      this.logger.log(`Assigning default moods to user ${userId}`);
      return await this.moodsService.assignDefaultMoodsToUser(userId);
    } catch (error) {
      this.logger.error(
        `Error assigning default moods to user: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while assigning default moods',
      );
    }
  }

  // Then put the more general mood routes AFTER the user-mood routes

  // Mood management routes (only for admins)

  @ApiOperation({ summary: 'Create a new mood' })
  @ApiResponse({ status: 201, description: 'Mood successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles(UserRoles.ADMIN, UserRoles.APP_ADMIN)
  @Post()
  async create(@Body() createMoodDto: CreateMoodDto) {
    try {
      this.logger.log(`Creating new mood: ${createMoodDto.name}`);
      return await this.moodsService.create(createMoodDto);
    } catch (error) {
      this.logger.error(`Error creating mood: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while creating the mood',
      );
    }
  }

  @ApiOperation({ summary: 'Update a mood' })
  @ApiResponse({ status: 200, description: 'Mood successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Mood not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles(UserRoles.ADMIN, UserRoles.APP_ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMoodDto: UpdateMoodDto,
  ) {
    try {
      this.logger.log(`Updating mood with ID: ${id}`);
      return await this.moodsService.update(id, updateMoodDto);
    } catch (error) {
      this.logger.error(`Error updating mood: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error.status === 404) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the mood',
      );
    }
  }

  @ApiOperation({ summary: 'Get all moods with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Moods successfully retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['default', 'reward', 'purchase'],
  })
  @ApiQuery({ name: 'search', required: false })
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    try {
      this.logger.log('Fetching all moods with pagination and filters');
      return await this.moodsService.findAll(
        { page: +page, limit: +limit },
        { type, search },
      );
    } catch (error) {
      this.logger.error(`Error fetching moods: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while fetching moods',
      );
    }
  }

  @ApiOperation({ summary: 'Get a mood by ID' })
  @ApiResponse({ status: 200, description: 'Mood successfully retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Mood not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      this.logger.log(`Fetching mood with ID: ${id}`);
      return await this.moodsService.findOne(id);
    } catch (error) {
      this.logger.error(`Error fetching mood: ${error.message}`, error.stack);
      if (error.status === 404) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while fetching the mood',
      );
    }
  }

  @ApiOperation({ summary: 'Seed the database with predefined moods' })
  @ApiResponse({ status: 201, description: 'Moods successfully seeded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Roles(UserRoles.NORMAL)
  @Post('seed')
  async seedMoods() {
    try {
      this.logger.log('Seeding database with predefined moods');
      return await this.moodsService.seedMoods();
    } catch (error) {
      this.logger.error(`Error seeding moods: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while seeding moods',
      );
    }
  }
}
