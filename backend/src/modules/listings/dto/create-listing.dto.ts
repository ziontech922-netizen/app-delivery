import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ListingCategory {
  PRODUCTS = 'PRODUCTS',
  SERVICES = 'SERVICES',
  VEHICLES = 'VEHICLES',
  REAL_ESTATE = 'REAL_ESTATE',
  JOBS = 'JOBS',
  FOOD = 'FOOD',
  ELECTRONICS = 'ELECTRONICS',
  FASHION = 'FASHION',
  HOME_GARDEN = 'HOME_GARDEN',
  SPORTS = 'SPORTS',
  PETS = 'PETS',
  OTHER = 'OTHER',
}

export enum PriceType {
  FIXED = 'FIXED',
  NEGOTIABLE = 'NEGOTIABLE',
  FREE = 'FREE',
  CONTACT = 'CONTACT',
}

export class CreateListingDto {
  @ApiProperty({ description: 'Título do anúncio', example: 'iPhone 12 Pro Max 256GB' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada do anúncio' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Preço do item', example: 4500.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ description: 'Tipo de preço', enum: PriceType, default: PriceType.FIXED })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiProperty({ description: 'Categoria do anúncio', enum: ListingCategory })
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @ApiPropertyOptional({ description: 'Subcategoria do anúncio' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Tags para busca', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'URLs das imagens', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'URL do áudio da postagem' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Se foi gerado por IA', default: false })
  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @ApiPropertyOptional({ description: 'Metadados da IA' })
  @IsOptional()
  aiMetadata?: Record<string, any>;
}
