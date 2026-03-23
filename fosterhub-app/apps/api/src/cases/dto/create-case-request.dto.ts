import { IsOptional, IsString } from 'class-validator';

export class CreateCaseRequestDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
