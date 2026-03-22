import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;
}
