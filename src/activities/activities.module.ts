import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityCategory } from './entities/activity-category.entity';
import { ActivitySubCategory } from './entities/activity-sub-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityCategory, ActivitySubCategory])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
