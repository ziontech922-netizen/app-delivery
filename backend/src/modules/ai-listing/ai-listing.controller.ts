import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AiListingService } from './ai-listing.service';
import { TextInputDto, AudioInputDto } from './dto/ai-listing-input.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string };
}

@ApiTags('ai-listing')
@Controller('ai-listing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiListingController {
  constructor(private readonly aiListingService: AiListingService) {}

  @Post('text')
  @ApiOperation({ summary: 'Criar anúncio a partir de texto livre' })
  @ApiResponse({ status: 201, description: 'Anúncio criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Texto inválido ou não processável' })
  createFromText(@Request() req: AuthenticatedRequest, @Body() dto: TextInputDto) {
    return this.aiListingService.processTextInput(req.user.id, dto);
  }

  @Post('audio')
  @ApiOperation({ summary: 'Criar anúncio a partir de áudio' })
  @ApiResponse({ status: 201, description: 'Anúncio criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Áudio inválido ou não processável' })
  createFromAudio(@Request() req: AuthenticatedRequest, @Body() dto: AudioInputDto) {
    return this.aiListingService.processAudioInput(req.user.id, dto);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview da extração de dados (sem criar anúncio)' })
  @ApiResponse({ status: 200, description: 'Dados extraídos para preview' })
  previewExtraction(@Body() dto: { text: string }) {
    return this.aiListingService.previewTextExtraction(dto.text);
  }
}
