import { IsNotEmpty, IsPhoneNumber, IsString, IsEmail } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  product_variant_id: string;

  @IsString()
  @IsNotEmpty()
  buyer_name: string;

  @IsEmail()
  @IsNotEmpty()
  buyer_email: string;

  @IsString()
  @IsNotEmpty()
  buyer_whatsapp: string;
}
