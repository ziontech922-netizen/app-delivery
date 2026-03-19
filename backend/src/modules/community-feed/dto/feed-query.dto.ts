import { IsString, IsOptional, IsNumber, IsEnum, Min, Max, IsLatitude, IsLongitude } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum FeedItemType {
  NEW_LISTING = 'NEW_LISTING',
  PROMOTION = 'PROMOTION',
  NEW_MERCHANT = 'NEW_MERCHANT',
  SPONSORED = 'SPONSORED',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  EVENT = 'EVENT',
}

export class FeedQueryDto {
  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Tipo de item', enum: FeedItemType })
  @IsOptional()
  @IsEnum(FeedItemType)
  type?: FeedItemType;

  @ApiPropertyOptional({ description: 'Latitude para geolocalização' })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude para geolocalização' })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

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
  @Max(50)
  @Type(() => Number)
  limit?: number;
}
