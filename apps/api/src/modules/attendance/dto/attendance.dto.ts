import { IsOptional, IsString, IsNumber } from 'class-validator';

export class EndAttendanceDto {
  @IsString()
  @IsOptional()
  work_summary?: string;
}

export class AttendanceReportFilterDto {
  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  shift_id?: string;
}

export class UpdateAttendanceSettingDto {
  @IsNumber()
  late_tolerance_minutes: number;

  @IsNumber()
  max_off_per_day: number;
}
