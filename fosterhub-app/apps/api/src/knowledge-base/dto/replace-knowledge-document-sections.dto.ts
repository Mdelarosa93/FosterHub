import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class KnowledgeDocumentSectionInputDto {
  @IsString()
  @MaxLength(200)
  heading!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sectionKey?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsString()
  body!: string;
}

export class ReplaceKnowledgeDocumentSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KnowledgeDocumentSectionInputDto)
  sections!: KnowledgeDocumentSectionInputDto[];
}
