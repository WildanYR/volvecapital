import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DispatchTaskDataDto {
  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  executeAt?: string;

  @IsOptional()
  payload?: any;
}

export class DispatchTaskDto {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsOptional()
  dispatchTaskData?: DispatchTaskDataDto;
}
