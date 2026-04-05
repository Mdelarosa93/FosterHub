import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCountyAllocationDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'PENDING', 'REMOVED'])
  status?: 'ACTIVE' | 'PENDING' | 'REMOVED';

  @IsOptional()
  @IsInt()
  @Min(0)
  seatLimit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
