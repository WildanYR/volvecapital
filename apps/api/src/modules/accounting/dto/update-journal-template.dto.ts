import { PartialType } from '@nestjs/mapped-types';
import { CreateJournalTemplateDto } from './create-journal-template.dto';

export class UpdateJournalTemplateDto extends PartialType(CreateJournalTemplateDto) {}
