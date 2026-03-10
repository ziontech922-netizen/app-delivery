import { IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query', example: 'pizza' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  q!: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Latitude for location-based search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for location-based search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ description: 'Maximum distance in km', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  radius?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchMerchantResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  tradeName?: string | null;

  @ApiPropertyOptional()
  logoUrl?: string | null;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiProperty()
  isOpen!: boolean;

  @ApiPropertyOptional()
  rating?: number | null;

  @ApiPropertyOptional()
  reviewCount?: number;

  @ApiPropertyOptional()
  deliveryFee?: number;

  @ApiPropertyOptional()
  estimatedTime?: number;

  @ApiPropertyOptional()
  distance?: number; // km from search location
}

export class SearchProductResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  price!: number;

  @ApiPropertyOptional()
  imageUrl?: string | null;

  @ApiProperty()
  merchantId!: string;

  @ApiProperty()
  merchantName!: string;

  @ApiPropertyOptional()
  merchantLogoUrl?: string | null;

  @ApiProperty()
  isAvailable!: boolean;
}

export class SearchResultDto {
  @ApiProperty({ type: [SearchMerchantResultDto] })
  merchants!: SearchMerchantResultDto[];

  @ApiProperty({ type: [SearchProductResultDto] })
  products!: SearchProductResultDto[];

  @ApiProperty()
  totalMerchants!: number;

  @ApiProperty()
  totalProducts!: number;

  @ApiProperty()
  query!: string;
}

export class AutocompleteResultDto {
  @ApiProperty()
  type!: 'merchant' | 'product' | 'category';

  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiPropertyOptional()
  subtext?: string;

  @ApiPropertyOptional()
  imageUrl?: string | null;
}
