import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  last4?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(2024)
  expYear?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  billingEmail?: string;
}
