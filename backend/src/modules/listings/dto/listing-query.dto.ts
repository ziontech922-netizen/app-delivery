import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListingCategory } from './create-listing.dto';
import { ListingStatus } from './update-listing.dto';

export enum ListingSortBy {
  CREATED_AT = 'createdAt',
  PRICE_ASC = 'priceAsc',
  PRICE_DESC = 'priceDesc',
  VIEW_COUNT = 'viewCount',
  RELEVANCE = 'relevance',
}

export class ListingQueryDto {
  @ApiPropertyOptional({ description: 'Termo de busca' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Categoria', enum: ListingCategory })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @ApiPropertyOptional({ description: 'Subcategoria' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Status do anúncio', enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Preço mínimo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Preço máximo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'ID do usuário' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Somente destaques', default: false })
  @IsOptional()
  @Type(() => Boolean)
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Latitude para busca por proximidade' })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude para busca por proximidade' })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Raio de busca em km', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  radiusKm?: number;

  @ApiPropertyOptional({ description: 'Ordenação', enum: ListingSortBy, default: ListingSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(ListingSortBy)
  sortBy?: ListingSortBy;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
