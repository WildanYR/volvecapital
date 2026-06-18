import { PartialType } from '@nestjs/mapped-types';
import { CreateManualBookCategoryDto } from './create-manual-book-category.dto';

export class UpdateManualBookCategoryDto extends PartialType(CreateManualBookCategoryDto) {}
