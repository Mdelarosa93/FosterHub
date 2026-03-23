import { IsOptional, IsString } from 'class-validator';

export class RequestDecisionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
