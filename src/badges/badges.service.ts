import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
// import { UpdateBadgeDto } from './dto/update-badge.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,

    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
  ) {}

  /**
   * Create a new badge
   * @param createBadgeDto - Data for creating a new badge
   * @returns The created badge
   */
  async createBadge(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    try {
      const badge = this.badgeRepository.create(createBadgeDto);
      return await this.badgeRepository.save(badge);
    } catch (error) {
      this.logger.error(
        `Failed to create badge: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        'Failed to create badge. Please check your input.',
      );
    }
  }

  /**
   * Get a badge by its ID
   * @param id - The ID of the badge to find
   * @returns The found badge
   * @throws NotFoundException if badge is not found
   */
  async getBadgeById(id: string): Promise<Badge> {
    try {
      const badge = await this.badgeRepository.findOne({ where: { id } });
      if (!badge) {
        throw new NotFoundException(`Badge with ID '${id}' not found`);
      }
      return badge;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get badge: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve badge');
    }
  }

  /**
   * Get badges with pagination and filtering
   * @param pagination - Page and limit parameters
   * @param filters - Optional filters for category, level, and active status
   * @returns Paginated list of badges
   */
  async getBadges(
    pagination: { page: number; limit: number },
    filters?: {
      category?: string;
      level?: string;
      isActive?: boolean;
      search?: string;
    },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<Badge> = {};

    if (filters?.category) {
      whereClause.category = filters.category;
    }

    if (filters?.level) {
      whereClause.level = filters.level;
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.search) {
      whereClause.name = Like(`%${filters.search}%`);
    }

    try {
      const [items, total] = await this.badgeRepository.findAndCount({
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
    } catch (error) {
      this.logger.error(
        `Failed to fetch badges: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch badges');
    }
  }

  /**
   * Award a badge to a user
   * @param awardBadgeDto - Data for awarding a badge
   * @returns The created user badge relationship
   */
  async awardBadgeToUser(awardBadgeDto: AwardBadgeDto): Promise<UserBadge> {
    const { userId, badgeId } = awardBadgeDto;

    // Check if badge exists
    const badge = await this.badgeRepository.findOne({
      where: { id: badgeId, isActive: true },
    });

    if (!badge) {
      throw new NotFoundException(
        `Badge with ID '${badgeId}' not found or is inactive`,
      );
    }

    // Check if user already has this badge
    const existingUserBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId },
    });

    if (existingUserBadge) {
      throw new BadRequestException('User already has this badge');
    }

    try {
      const userBadge = this.userBadgeRepository.create({
        userId,
        badgeId,
      });

      return await this.userBadgeRepository.save(userBadge);
    } catch (error) {
      this.logger.error(`Failed to award badge: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to award badge to user');
    }
  }

  /**
   * Get all badges for a specific user
   * @param userId - ID of the user
   * @returns Array of user badges with badge details
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const userBadges = await this.userBadgeRepository.find({
        where: { userId },
        relations: ['badge'],
        order: { awardedAt: 'DESC' },
      });

      return userBadges;
    } catch (error) {
      this.logger.error(
        `Failed to get user badges: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve user badges');
    }
  }
}
