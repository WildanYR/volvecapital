import { Module } from '@nestjs/common';
import { ManualBookCategoryController } from './manual-book-category.controller';
import { ManualBookCategoryService } from './manual-book-category.service';

@Module({
  controllers: [ManualBookCategoryController],
  providers: [ManualBookCategoryService],
  exports: [ManualBookCategoryService],
})
export class ManualBookCategoryModule {}
