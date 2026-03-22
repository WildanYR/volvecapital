import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
