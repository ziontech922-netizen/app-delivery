import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export type UploadType = 
  | 'product-image' 
  | 'merchant-logo' 
  | 'merchant-banner' 
  | 'driver-avatar' 
  | 'user-avatar'
  | 'listing-image'      // Marketplace
  | 'chat-attachment'    // Chat images/files
  | 'chat-audio'         // Chat voice messages
  | 'ai-audio'           // AI listing audio input
  | 'feed-image'         // Community feed posts
  | 'delivery-photo';    // Delivery confirmation photos

interface PresignResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly enabled: boolean;

  // Allowed MIME types for images
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  // Allowed MIME types for audio
  private readonly allowedAudioTypes = [
    'audio/mpeg',        // MP3
    'audio/mp4',         // M4A
    'audio/wav',         // WAV
    'audio/webm',        // WebM audio
    'audio/ogg',         // OGG
    'audio/aac',         // AAC
  ];

  // Combined allowed types
  private readonly allowedMimeTypes = [
    ...this.allowedImageTypes,
    ...this.allowedAudioTypes,
  ];

  // Max file sizes
  private readonly maxImageSize = 5 * 1024 * 1024;   // 5MB for images
  private readonly maxAudioSize = 25 * 1024 * 1024;  // 25MB for audio (Whisper limit)

  // Folder mapping by type
  private readonly folders: Record<UploadType, string> = {
    'product-image': 'products',
    'merchant-logo': 'merchants/logos',
    'merchant-banner': 'merchants/banners',
    'driver-avatar': 'drivers',
    'user-avatar': 'users',
    'listing-image': 'listings',
    'chat-attachment': 'chat/attachments',
    'chat-audio': 'chat/audio',
    'ai-audio': 'ai/audio',
    'feed-image': 'feed',
    'delivery-photo': 'deliveries',
  };

  // Types that accept audio
  private readonly audioTypes: UploadType[] = ['chat-audio', 'ai-audio'];

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'delivery-uploads';
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || endpoint || '';

    // Check if storage is configured
    this.enabled = !!(accessKeyId && secretAccessKey && endpoint);

    if (this.enabled && accessKeyId && secretAccessKey && endpoint) {
      this.s3Client = new S3Client({
        region: this.configService.get<string>('S3_REGION') || 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Required for R2/MinIO
      });
      this.logger.log('S3/R2 storage initialized');
    } else {
      this.logger.warn('S3/R2 storage not configured - uploads will fail');
    }
  }

  /**
   * Generate a presigned URL for uploading
   */
  async generatePresignedUrl(
    type: UploadType,
    filename: string,
    contentType: string,
    contentLength: number,
  ): Promise<PresignResult> {
    // Validate storage is enabled
    if (!this.enabled || !this.s3Client) {
      throw new BadRequestException('Storage service is not configured');
    }

    // Check if this is an audio upload type
    const isAudioUpload = this.audioTypes.includes(type);
    
    // Validate content type based on upload type
    if (isAudioUpload) {
      if (!this.allowedAudioTypes.includes(contentType)) {
        throw new BadRequestException(
          `Audio type not allowed. Allowed types: ${this.allowedAudioTypes.join(', ')}`,
        );
      }
    } else {
      if (!this.allowedImageTypes.includes(contentType)) {
        throw new BadRequestException(
          `Image type not allowed. Allowed types: ${this.allowedImageTypes.join(', ')}`,
        );
      }
    }

    // Validate file size based on type
    const maxSize = isAudioUpload ? this.maxAudioSize : this.maxImageSize;
    if (contentLength > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Generate unique key
    const extension = this.getExtension(filename, contentType);
    const folder = this.folders[type];
    const uniqueId = uuidv4();
    const key = `${folder}/${uniqueId}${extension}`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // Build public URL
    const fileUrl = this.buildPublicUrl(key);

    this.logger.log(`Generated presigned URL for ${type}: ${key}`);

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.enabled || !this.s3Client) {
      this.logger.warn('Storage not enabled, skipping delete');
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Extract key from a full URL
   */
  extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.replace(/^\//, '');
    } catch {
      return null;
    }
  }

  /**
   * Validate upload type
   */
  isValidUploadType(type: string): type is UploadType {
    return Object.keys(this.folders).includes(type);
  }

  private getExtension(filename: string, contentType: string): string {
    // Try to get from filename
    const match = filename.match(/\.[^.]+$/);
    if (match) return match[0].toLowerCase();

    // Fallback to content type
    const typeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
      'audio/wav': '.wav',
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'audio/aac': '.aac',
    };

    return typeMap[contentType] || '.bin';
  }

  private buildPublicUrl(key: string): string {
    // For R2, use the public URL if configured
    if (this.publicUrl) {
      const baseUrl = this.publicUrl.replace(/\/$/, '');
      return `${baseUrl}/${key}`;
    }

    // Fallback
    return `/${key}`;
  }
}
