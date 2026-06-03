import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class DispatchTaskData {
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
  @IsString()
  payload?: string;

  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class SocketDispatchTaskDTO {
  @IsNotEmpty()
  @IsString()
  taskId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DispatchTaskData)
  data?: DispatchTaskData;
}
