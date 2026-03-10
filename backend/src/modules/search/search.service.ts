import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { MerchantStatus, Prisma } from '@prisma/client';
import {
  SearchQueryDto,
  SearchResultDto,
  SearchMerchantResultDto,
  SearchProductResultDto,
  AutocompleteResultDto,
} from './dto/search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Full-text search for merchants and products
   */
  async search(dto: SearchQueryDto): Promise<SearchResultDto> {
    const { q, category, lat, lng, radius = 10, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    // Prepare search term for PostgreSQL full-text search
    // Convert "pizza calabresa" to "pizza:* & calabresa:*" for prefix matching
    const searchTerm = this.prepareSearchTerm(q);

    this.logger.debug(`Searching for: "${q}" -> "${searchTerm}"`);

    // Execute searches in parallel
    const [merchants, products, totalMerchants, totalProducts] = await Promise.all([
      this.searchMerchants(searchTerm, { category, lat, lng, radius, skip, take: limit }),
      this.searchProducts(searchTerm, { category, skip, take: limit }),
      this.countMerchants(searchTerm, { category }),
      this.countProducts(searchTerm, { category }),
    ]);

    return {
      merchants,
      products,
      totalMerchants,
      totalProducts,
      query: q,
    };
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(query: string, limit = 8): Promise<AutocompleteResultDto[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = this.prepareSearchTerm(query);
    const results: AutocompleteResultDto[] = [];

    // Search merchants
    const merchants = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; trade_name: string | null; logo_url: string | null }>
    >`
      SELECT id, business_name as name, trade_name, logo_url
      FROM merchants
      WHERE status = 'ACTIVE'
        AND deleted_at IS NULL
        AND (
          to_tsvector('portuguese', business_name || ' ' || COALESCE(trade_name, '')) 
          @@ to_tsquery('portuguese', ${searchTerm})
          OR business_name ILIKE ${'%' + query + '%'}
          OR trade_name ILIKE ${'%' + query + '%'}
        )
      LIMIT ${Math.ceil(limit / 2)}
    `;

    for (const m of merchants) {
      results.push({
        type: 'merchant',
        id: m.id,
        text: m.trade_name || m.name,
        subtext: 'Restaurante',
        imageUrl: m.logo_url,
      });
    }

    // Search products
    const products = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; merchant_name: string; image_url: string | null }>
    >`
      SELECT p.id, p.name, m.business_name as merchant_name, p.image_url
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.is_available = true
        AND p.deleted_at IS NULL
        AND m.status = 'ACTIVE'
        AND m.deleted_at IS NULL
        AND (
          to_tsvector('portuguese', p.name || ' ' || COALESCE(p.description, '')) 
          @@ to_tsquery('portuguese', ${searchTerm})
          OR p.name ILIKE ${'%' + query + '%'}
        )
      LIMIT ${Math.ceil(limit / 2)}
    `;

    for (const p of products) {
      results.push({
        type: 'product',
        id: p.id,
        text: p.name,
        subtext: p.merchant_name,
        imageUrl: p.image_url,
      });
    }

    return results.slice(0, limit);
  }

  /**
   * Search merchants using full-text search
   */
  private async searchMerchants(
    searchTerm: string,
    options: {
      category?: string;
      lat?: number;
      lng?: number;
      radius?: number;
      skip: number;
      take: number;
    },
  ): Promise<SearchMerchantResultDto[]> {
    const { category, lat, lng, radius = 10, skip, take } = options;

    // Build the query with optional location filter
    let query: string;
    let params: any[];

    if (lat !== undefined && lng !== undefined) {
      // With location - calculate distance using Haversine formula
      query = `
        SELECT 
          m.id,
          m.business_name as name,
          m.trade_name,
          m.logo_url,
          m.is_open,
          m.average_rating as rating,
          m.total_reviews as review_count,
          m.delivery_fee,
          m.estimated_time,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(CAST(m.latitude AS FLOAT))) *
              cos(radians(CAST(m.longitude AS FLOAT)) - radians($2)) +
              sin(radians($1)) * sin(radians(CAST(m.latitude AS FLOAT)))
            )
          ) as distance
        FROM merchants m
        WHERE m.status = 'ACTIVE'
          AND m.deleted_at IS NULL
          AND m.latitude IS NOT NULL
          AND m.longitude IS NOT NULL
          AND (
            to_tsvector('portuguese', m.business_name || ' ' || COALESCE(m.trade_name, '') || ' ' || COALESCE(m.description, '')) 
            @@ to_tsquery('portuguese', $3)
            OR m.business_name ILIKE $4
            OR m.trade_name ILIKE $4
          )
        HAVING (
          6371 * acos(
            cos(radians($1)) * cos(radians(CAST(m.latitude AS FLOAT))) *
            cos(radians(CAST(m.longitude AS FLOAT)) - radians($2)) +
            sin(radians($1)) * sin(radians(CAST(m.latitude AS FLOAT)))
          )
        ) <= $5
        ORDER BY distance ASC, m.average_rating DESC NULLS LAST
        LIMIT $6 OFFSET $7
      `;
      params = [lat, lng, searchTerm, `%${searchTerm.replace(/[&:*]/g, '')}%`, radius, take, skip];
    } else {
      // Without location
      query = `
        SELECT 
          m.id,
          m.business_name as name,
          m.trade_name,
          m.logo_url,
          m.is_open,
          m.average_rating as rating,
          m.total_reviews as review_count,
          m.delivery_fee,
          m.estimated_time,
          NULL as distance
        FROM merchants m
        WHERE m.status = 'ACTIVE'
          AND m.deleted_at IS NULL
          AND (
            to_tsvector('portuguese', m.business_name || ' ' || COALESCE(m.trade_name, '') || ' ' || COALESCE(m.description, '')) 
            @@ to_tsquery('portuguese', $1)
            OR m.business_name ILIKE $2
            OR m.trade_name ILIKE $2
          )
        ORDER BY m.average_rating DESC NULLS LAST, m.is_open DESC
        LIMIT $3 OFFSET $4
      `;
      const likePattern = `%${searchTerm.replace(/[&:*]/g, '')}%`;
      params = [searchTerm, likePattern, take, skip];
    }

    const merchants = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

    return merchants.map((m) => ({
      id: m.id,
      name: m.trade_name || m.name,
      tradeName: m.trade_name,
      logoUrl: m.logo_url,
      isOpen: m.is_open,
      rating: m.rating ? parseFloat(m.rating) : null,
      reviewCount: m.review_count || 0,
      deliveryFee: m.delivery_fee ? parseFloat(m.delivery_fee) : 0,
      estimatedTime: m.estimated_time,
      distance: m.distance ? parseFloat(m.distance.toFixed(1)) : undefined,
    }));
  }

  /**
   * Search products using full-text search
   */
  private async searchProducts(
    searchTerm: string,
    options: { category?: string; skip: number; take: number },
  ): Promise<SearchProductResultDto[]> {
    const { skip, take } = options;
    const likePattern = `%${searchTerm.replace(/[&:*]/g, '')}%`;

    const products = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        m.id as merchant_id,
        m.business_name as merchant_name,
        m.trade_name as merchant_trade_name,
        m.logo_url as merchant_logo_url,
        ts_rank(
          to_tsvector('portuguese', p.name || ' ' || COALESCE(p.description, '')),
          to_tsquery('portuguese', ${searchTerm})
        ) as rank
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.is_available = true
        AND p.deleted_at IS NULL
        AND m.status = 'ACTIVE'
        AND m.deleted_at IS NULL
        AND (
          to_tsvector('portuguese', p.name || ' ' || COALESCE(p.description, '')) 
          @@ to_tsquery('portuguese', ${searchTerm})
          OR p.name ILIKE ${likePattern}
          OR p.description ILIKE ${likePattern}
        )
      ORDER BY rank DESC, p.name ASC
      LIMIT ${take} OFFSET ${skip}
    `;

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      imageUrl: p.image_url,
      merchantId: p.merchant_id,
      merchantName: p.merchant_trade_name || p.merchant_name,
      merchantLogoUrl: p.merchant_logo_url,
      isAvailable: p.is_available,
    }));
  }

  /**
   * Count matching merchants
   */
  private async countMerchants(
    searchTerm: string,
    options: { category?: string },
  ): Promise<number> {
    const likePattern = `%${searchTerm.replace(/[&:*]/g, '')}%`;

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM merchants m
      WHERE m.status = 'ACTIVE'
        AND m.deleted_at IS NULL
        AND (
          to_tsvector('portuguese', m.business_name || ' ' || COALESCE(m.trade_name, '') || ' ' || COALESCE(m.description, '')) 
          @@ to_tsquery('portuguese', ${searchTerm})
          OR m.business_name ILIKE ${likePattern}
          OR m.trade_name ILIKE ${likePattern}
        )
    `;

    return Number(result[0].count);
  }

  /**
   * Count matching products
   */
  private async countProducts(
    searchTerm: string,
    options: { category?: string },
  ): Promise<number> {
    const likePattern = `%${searchTerm.replace(/[&:*]/g, '')}%`;

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.is_available = true
        AND p.deleted_at IS NULL
        AND m.status = 'ACTIVE'
        AND m.deleted_at IS NULL
        AND (
          to_tsvector('portuguese', p.name || ' ' || COALESCE(p.description, '')) 
          @@ to_tsquery('portuguese', ${searchTerm})
          OR p.name ILIKE ${likePattern}
          OR p.description ILIKE ${likePattern}
        )
    `;

    return Number(result[0].count);
  }

  /**
   * Prepare search term for PostgreSQL full-text search
   * "pizza calabresa" -> "pizza:* & calabresa:*"
   */
  private prepareSearchTerm(query: string): string {
    if (!query) return '';

    // Remove special characters and split into words
    const words = query
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    if (words.length === 0) return '';

    // Add prefix matching (:*) and combine with AND (&)
    return words.map((w) => `${w}:*`).join(' & ');
  }
}
