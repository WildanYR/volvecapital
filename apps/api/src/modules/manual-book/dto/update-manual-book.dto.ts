import { PartialType } from '@nestjs/mapped-types';
import { CreateManualBookDto } from './create-manual-book.dto';

export class UpdateManualBookDto extends PartialType(CreateManualBookDto) {}
