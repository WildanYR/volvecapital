import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { EmailSubjectController } from './email-subject.controller';
import { EmailSubjectService } from './email-subject.service';

@Module({
  imports: [DatabaseModule],
  providers: [EmailSubjectService],
  controllers: [EmailSubjectController],
})
export class EmailSubjectModule {}
