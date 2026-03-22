import { IsNotEmpty, IsNumber } from 'class-validator';

export class FreezeAccountDto {
  @IsNotEmpty()
  @IsNumber()
  duration: number;
}
