import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateReviewDto,
  ReviewResponseDto,
  MerchantReviewsResponseDto,
  DriverReviewsResponseDto,
} from './dto/review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review for a delivered order' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or order not eligible' })
  @ApiResponse({ status: 403, description: 'Not your order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createReview(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(req.user.sub, dto);
  }

  @Get('merchant/:id')
  @ApiOperation({ summary: 'Get reviews for a merchant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Merchant reviews',
    type: MerchantReviewsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getMerchantReviews(
    @Param('id') merchantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<MerchantReviewsResponseDto> {
    return this.reviewsService.getMerchantReviews(
      merchantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('driver/:id')
  @ApiOperation({ summary: 'Get reviews for a driver' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Driver reviews',
    type: DriverReviewsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async getDriverReviews(
    @Param('id') driverId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<DriverReviewsResponseDto> {
    return this.reviewsService.getDriverReviews(
      driverId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('order/:orderId/can-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if customer can review an order' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether the order can be reviewed',
  })
  async canReviewOrder(
    @Request() req: { user: { sub: string } },
    @Param('orderId') orderId: string,
  ): Promise<{ canReview: boolean }> {
    const canReview = await this.reviewsService.canReviewOrder(req.user.sub, orderId);
    return { canReview };
  }
}
