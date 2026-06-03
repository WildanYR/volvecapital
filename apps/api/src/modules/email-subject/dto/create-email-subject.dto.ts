import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmailSubjectDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  context: string;

  @IsNotEmpty()
  @IsString()
  extract_method: string;
}
