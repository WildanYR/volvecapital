import { Module } from '@nestjs/common';
import { WeeklyOffController } from './weekly-off.controller';
import { WeeklyOffService } from './weekly-off.service';

@Module({
  controllers: [WeeklyOffController],
  providers: [WeeklyOffService],
  exports: [WeeklyOffService],
})
export class WeeklyOffModule {}
