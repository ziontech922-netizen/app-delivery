import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Order ID to review' })
  @IsString()
  orderId!: string;

  @ApiProperty({ description: 'Merchant rating (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  merchantRating!: number;

  @ApiPropertyOptional({ description: 'Driver rating (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  driverRating?: number;

  @ApiPropertyOptional({ description: 'Comment about the merchant', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  merchantComment?: string;

  @ApiPropertyOptional({ description: 'Comment about the driver', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  driverComment?: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  merchantRating!: number;

  @ApiPropertyOptional()
  driverRating?: number | null;

  @ApiPropertyOptional()
  merchantComment?: string | null;

  @ApiPropertyOptional()
  driverComment?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Customer info' })
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class MerchantReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  reviews!: ReviewResponseDto[];

  @ApiProperty()
  averageRating!: number | null;

  @ApiProperty()
  totalReviews!: number;

  @ApiProperty({ description: 'Rating distribution (1-5)' })
  distribution!: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class DriverReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  reviews!: ReviewResponseDto[];

  @ApiProperty()
  averageRating!: number | null;

  @ApiProperty()
  totalReviews!: number;

  @ApiProperty({ description: 'Rating distribution (1-5)' })
  distribution!: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
