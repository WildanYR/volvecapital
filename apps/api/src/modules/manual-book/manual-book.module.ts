import { Module } from '@nestjs/common';
import { ManualBookController } from './manual-book.controller';
import { ManualBookService } from './manual-book.service';

@Module({
  controllers: [ManualBookController],
  providers: [ManualBookService],
  exports: [ManualBookService],
})
export class ManualBookModule {}
