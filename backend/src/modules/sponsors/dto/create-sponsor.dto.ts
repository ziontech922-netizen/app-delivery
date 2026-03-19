import { IsString, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SponsorPlacement {
  HOME_BANNER = 'HOME_BANNER',
  CATEGORY_HEADER = 'CATEGORY_HEADER',
  FEED_INLINE = 'FEED_INLINE',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  LISTING_DETAIL = 'LISTING_DETAIL',
  FEATURED_CAROUSEL = 'FEATURED_CAROUSEL',
}

export class CreateSponsorDto {
  @ApiProperty({ description: 'Nome do patrocinador' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'URL do logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'URL do banner' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ description: 'URL do website' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty({ description: 'Posições de exibição', enum: SponsorPlacement, isArray: true })
  @IsArray()
  @IsEnum(SponsorPlacement, { each: true })
  placements!: SponsorPlacement[];

  @ApiPropertyOptional({ description: 'Prioridade (maior = mais destaque)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ description: 'Cidades alvo', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCities?: string[];

  @ApiPropertyOptional({ description: 'Categorias alvo', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCategories?: string[];

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Data de término' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSponsorDto {
  @ApiPropertyOptional({ description: 'Nome do patrocinador' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'URL do logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'URL do banner' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ description: 'URL do website' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Posições de exibição', enum: SponsorPlacement, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SponsorPlacement, { each: true })
  placements?: SponsorPlacement[];

  @ApiPropertyOptional({ description: 'Prioridade' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ description: 'Cidades alvo', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCities?: string[];

  @ApiPropertyOptional({ description: 'Categorias alvo', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCategories?: string[];

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
