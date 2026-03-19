import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TextInputDto {
  @ApiProperty({ 
    description: 'Texto livre descrevendo o que deseja anunciar',
    example: 'vendo bicicleta aro 29 por 800 reais, aceito negociação'
  })
  @IsString()
  @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({ description: 'URLs de imagens já enviadas', type: [String] })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: 'Cidade do anúncio' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado do anúncio' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class AudioInputDto {
  @ApiProperty({ description: 'URL do arquivo de áudio a ser transcrito' })
  @IsString()
  audioUrl!: string;

  @ApiPropertyOptional({ description: 'URLs de imagens já enviadas', type: [String] })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: 'Cidade do anúncio' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado do anúncio' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class AiExtractedData {
  title!: string;
  description?: string;
  price?: number;
  priceType!: 'FIXED' | 'NEGOTIABLE' | 'FREE' | 'CONTACT';
  category!: string;
  subcategory?: string;
  tags!: string[];
  confidence!: number;
  rawInput!: string;
}
