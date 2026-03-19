import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @ApiProperty({ description: 'ID do destinatário' })
  @IsString()
  recipientId!: string;

  @ApiProperty({ description: 'Tipo da mensagem', enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiProperty({ description: 'Conteúdo da mensagem (texto ou URL)' })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ description: 'ID do anúncio relacionado (contexto)' })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Tipo da mensagem', enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiProperty({ description: 'Conteúdo da mensagem (texto ou URL)' })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  metadata?: Record<string, any>;
}
