import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDashboardUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsUUID('4')
  role_id: string;
}

export class UpdateDashboardUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsUUID('4')
  role_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class LoginDashboardUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
