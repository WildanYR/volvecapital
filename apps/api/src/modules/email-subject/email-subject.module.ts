import { Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { EmailSubjectController } from './email-subject.controller';
import { EmailSubjectService } from './email-subject.service';

@Module({
  imports: [UtilityModule],
  providers: [EmailSubjectService],
  controllers: [EmailSubjectController],
})
export class EmailSubjectModule {}
