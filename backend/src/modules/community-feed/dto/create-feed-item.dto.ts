import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeedItemType } from './feed-query.dto';

export class CreateFeedItemDto {
  @ApiProperty({ description: 'Tipo do item', enum: FeedItemType })
  @IsEnum(FeedItemType)
  type!: FeedItemType;

  @ApiProperty({ description: 'Título do item' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL de destino ao clicar' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'ID do anúncio relacionado' })
  @IsOptional()
  @IsString()
  listingId?: string;

  @ApiPropertyOptional({ description: 'ID do comerciante relacionado' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ description: 'ID do patrocinador relacionado' })
  @IsOptional()
  @IsString()
  sponsorId?: string;

  @ApiPropertyOptional({ description: 'Cidade alvo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado alvo' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Prioridade (maior = mais destaque)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
