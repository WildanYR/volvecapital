import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemVoucherDto {
  @IsString()
  @IsNotEmpty()
  voucher_code: string;
}
