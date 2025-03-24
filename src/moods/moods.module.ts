import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodsService } from './moods.service';
import { MoodsController } from './moods.controller';
import { Mood } from './entities/mood.entity';
import { UserMoods } from './entities/user-moods.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mood, UserMoods]),
    AuthModule,
    UserModule,
  ],
  controllers: [MoodsController],
  providers: [MoodsService],
  exports: [MoodsService],
})
export class MoodsModule {}
