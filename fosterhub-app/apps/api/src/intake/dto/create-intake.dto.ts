import { IsOptional, IsString } from 'class-validator';

export class CreateIntakeDto {
  @IsString()
  childFirstName!: string;

  @IsString()
  childLastName!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
