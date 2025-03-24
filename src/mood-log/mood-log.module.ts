import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodLogController } from './mood-log.controller';
import { MoodLogService } from './mood-log.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { MoodLog } from './entities/mood-log.entity';
import { MoodStreaks } from './entities/mood-streaks.entity';
import { UserMoods } from '../moods/entities/user-moods.entity';
import { ActivityCategory } from '../activities/entities/activity-category.entity';
import { ActivitySubCategory } from '../activities/entities/activity-sub-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MoodLog,
      MoodStreaks,
      UserMoods,
      AuthModule,
      UserModule,
      ActivityCategory,
      ActivitySubCategory,
    ]),
  ],
  controllers: [MoodLogController],
  providers: [MoodLogService],
  exports: [MoodLogService],
})
export class MoodLogModule {}
