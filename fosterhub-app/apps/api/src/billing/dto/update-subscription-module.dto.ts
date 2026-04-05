import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubscriptionModuleDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
