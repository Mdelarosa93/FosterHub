import { IsString } from 'class-validator';

export class ChangeBillingPlanDto {
  @IsString()
  billingPlanId!: string;
}
