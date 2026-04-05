import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateKnowledgeDocumentSourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceType?: string;

  @IsOptional()
  @IsIn(['ORGANIZATION_ONLY', 'INHERIT_TO_CHILDREN'])
  accessScope?: 'ORGANIZATION_ONLY' | 'INHERIT_TO_CHILDREN';

  @IsOptional()
  @IsIn(['DRAFT', 'READY', 'ARCHIVED'])
  status?: 'DRAFT' | 'READY' | 'ARCHIVED';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  versionLabel?: string;

  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
