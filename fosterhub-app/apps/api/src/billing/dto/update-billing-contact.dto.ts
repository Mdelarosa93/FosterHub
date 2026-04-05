import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBillingContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  billingContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  billingContactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  billingContactPhone?: string;
}
