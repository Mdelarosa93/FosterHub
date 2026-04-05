import { IsString, MinLength } from 'class-validator';

export class ImportKnowledgeDocumentSectionsDto {
  @IsString()
  @MinLength(10)
  rawText!: string;
}
