import { IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  caseId!: string;

  @IsString()
  title!: string;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
