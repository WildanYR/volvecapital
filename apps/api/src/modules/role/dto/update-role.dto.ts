import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SetRolePermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permission_ids: string[];
}
