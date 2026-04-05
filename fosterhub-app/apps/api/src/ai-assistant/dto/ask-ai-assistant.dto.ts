import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AskAiAssistantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  conversationId?: string;
}
