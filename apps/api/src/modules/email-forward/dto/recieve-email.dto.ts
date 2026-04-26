import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class EmailDataDto {
  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsString()
  text: string;
}

export class RecieveEmailDto {
  @IsNotEmpty()
  @IsString()
  tenant: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailDataDto)
  emails: EmailDataDto[];
}
