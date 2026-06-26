import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'start_time must be a valid time in HH:mm format',
  })
  start_time: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'end_time must be a valid time in HH:mm format',
  })
  end_time: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateShiftDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'start_time must be a valid time in HH:mm format',
  })
  start_time?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'end_time must be a valid time in HH:mm format',
  })
  end_time?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class AssignShiftDto {
  @IsString()
  @IsNotEmpty()
  shift_id: string;

  @IsString()
  @IsNotEmpty()
  effective_date: string; // YYYY-MM-DD
}
