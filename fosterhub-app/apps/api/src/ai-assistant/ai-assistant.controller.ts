import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AskAiAssistantDto } from './dto/ask-ai-assistant.dto';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('ask')
  async ask(@Body() body: AskAiAssistantDto, @CurrentUser() user: any) {
    return { data: await this.aiAssistantService.ask(body.question, user, body.conversationId) };
  }
}
