import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateAccessTokenDto {
  @IsNotEmpty()
  @IsString()
  tenant_id: string;

  @IsNotEmpty()
  @IsString()
  secret: string;
}
