import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { CreateReviewDto, ReviewResponseDto } from './dto/review.dto';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a review for an order
   */
  async createReview(
    customerId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    // Get the order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        review: true,
        driver: {
          include: {
            driverProfile: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate: only the customer who made the order can review
    if (order.customerId !== customerId) {
      throw new ForbiddenException('You can only review your own orders');
    }

    // Validate: order must be delivered
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be reviewed');
    }

    // Validate: order hasn't been reviewed yet
    if (order.review) {
      throw new BadRequestException('This order has already been reviewed');
    }

    // Validate: if driver rating provided, order must have a driver
    if (dto.driverRating && !order.driverId) {
      throw new BadRequestException('Cannot rate driver - no driver assigned to this order');
    }

    // Get driver profile ID if exists
    const driverProfileId = order.driver?.driverProfile?.id || null;

    // Create review
    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        customerId,
        merchantId: order.merchantId,
        driverId: driverProfileId,
        merchantRating: dto.merchantRating,
        driverRating: dto.driverRating,
        merchantComment: dto.merchantComment,
        driverComment: dto.driverComment,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update merchant rating
    await this.updateMerchantRating(order.merchantId);

    // Update driver rating if applicable
    if (driverProfileId && dto.driverRating) {
      await this.updateDriverRating(driverProfileId);
    }

    this.logger.log(`Review created for order ${dto.orderId} by customer ${customerId}`);

    return {
      id: review.id,
      orderId: review.orderId,
      merchantRating: review.merchantRating,
      driverRating: review.driverRating,
      merchantComment: review.merchantComment,
      driverComment: review.driverComment,
      createdAt: review.createdAt,
      customer: review.customer,
    };
  }

  /**
   * Get reviews for a merchant
   */
  async getMerchantReviews(
    merchantId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    reviews: ReviewResponseDto[];
    averageRating: number | null;
    totalReviews: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  }> {
    // Check merchant exists
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    // Get reviews
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { merchantId },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where: { merchantId } }),
    ]);

    // Get distribution
    const distribution = await this.getRatingDistribution(merchantId, 'merchant');

    return {
      reviews: reviews.map((r: typeof reviews[0]) => ({
        id: r.id,
        orderId: r.orderId,
        merchantRating: r.merchantRating,
        driverRating: r.driverRating,
        merchantComment: r.merchantComment,
        driverComment: r.driverComment,
        createdAt: r.createdAt,
        customer: r.customer,
      })),
      averageRating: merchant.averageRating
        ? parseFloat(merchant.averageRating.toString())
        : null,
      totalReviews: total,
      distribution,
    };
  }

  /**
   * Get reviews for a driver
   */
  async getDriverReviews(
    driverId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    reviews: ReviewResponseDto[];
    averageRating: number | null;
    totalReviews: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  }> {
    // Check driver exists
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Get reviews with driver rating
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          driverId,
          driverRating: { not: null },
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          driverId,
          driverRating: { not: null },
        },
      }),
    ]);

    // Get distribution
    const distribution = await this.getRatingDistribution(driverId, 'driver');

    return {
      reviews: reviews.map((r: typeof reviews[0]) => ({
        id: r.id,
        orderId: r.orderId,
        merchantRating: r.merchantRating,
        driverRating: r.driverRating,
        merchantComment: r.merchantComment,
        driverComment: r.driverComment,
        createdAt: r.createdAt,
        customer: r.customer,
      })),
      averageRating: driver.averageRating
        ? parseFloat(driver.averageRating.toString())
        : null,
      totalReviews: total,
      distribution,
    };
  }

  /**
   * Check if an order can be reviewed
   */
  async canReviewOrder(customerId: string, orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });

    if (!order) return false;
    if (order.customerId !== customerId) return false;
    if (order.status !== OrderStatus.DELIVERED) return false;
    if (order.review) return false;

    return true;
  }

  /**
   * Update merchant average rating
   */
  private async updateMerchantRating(merchantId: string): Promise<void> {
    const stats = await this.prisma.review.aggregate({
      where: { merchantId },
      _avg: { merchantRating: true },
      _count: { merchantRating: true },
    });

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: {
        averageRating: stats._avg.merchantRating
          ? new Decimal(stats._avg.merchantRating.toFixed(2))
          : null,
        totalReviews: stats._count.merchantRating,
      },
    });

    this.logger.log(
      `Updated merchant ${merchantId} rating: ${stats._avg.merchantRating?.toFixed(2)} (${stats._count.merchantRating} reviews)`,
    );
  }

  /**
   * Update driver average rating
   */
  private async updateDriverRating(driverProfileId: string): Promise<void> {
    const stats = await this.prisma.review.aggregate({
      where: {
        driverId: driverProfileId,
        driverRating: { not: null },
      },
      _avg: { driverRating: true },
      _count: { driverRating: true },
    });

    await this.prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: {
        averageRating: stats._avg.driverRating
          ? new Decimal(stats._avg.driverRating.toFixed(2))
          : null,
        totalRatings: stats._count.driverRating,
      },
    });

    this.logger.log(
      `Updated driver ${driverProfileId} rating: ${stats._avg.driverRating?.toFixed(2)} (${stats._count.driverRating} reviews)`,
    );
  }

  /**
   * Get rating distribution for charts
   */
  private async getRatingDistribution(
    targetId: string,
    type: 'merchant' | 'driver',
  ): Promise<{ 1: number; 2: number; 3: number; 4: number; 5: number }> {
    const ratingField = type === 'merchant' ? 'merchantRating' : 'driverRating';
    const whereField = type === 'merchant' ? 'merchantId' : 'driverId';

    const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    // Count each rating
    for (let rating = 1; rating <= 5; rating++) {
      const count = await this.prisma.review.count({
        where: {
          [whereField]: targetId,
          [ratingField]: rating,
        },
      });
      distribution[rating as 1 | 2 | 3 | 4 | 5] = count;
    }

    return distribution;
  }
}
