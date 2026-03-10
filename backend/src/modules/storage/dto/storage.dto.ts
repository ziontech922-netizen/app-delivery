import { IsString, IsIn, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const UPLOAD_TYPES = [
  'product-image',
  'merchant-logo',
  'merchant-banner',
  'driver-avatar',
  'user-avatar',
] as const;

export class PresignUploadDto {
  @ApiProperty({
    description: 'Type of upload',
    enum: UPLOAD_TYPES,
    example: 'product-image',
  })
  @IsString()
  @IsIn(UPLOAD_TYPES, {
    message: `type must be one of: ${UPLOAD_TYPES.join(', ')}`,
  })
  type!: (typeof UPLOAD_TYPES)[number];

  @ApiProperty({
    description: 'Original filename',
    example: 'burger.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    message: 'contentType must be one of: image/jpeg, image/png, image/webp, image/gif',
  })
  contentType!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
    minimum: 1,
    maximum: 5242880,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'File size must be at least 1 byte' })
  @Max(5242880, { message: 'File size must be at most 5MB' })
  contentLength!: number;
}

export class PresignResponseDto {
  @ApiProperty({
    description: 'Presigned URL to upload the file',
    example: 'https://bucket.s3.amazonaws.com/products/uuid.jpg?X-Amz-...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'Public URL of the file after upload',
    example: 'https://cdn.example.com/products/uuid.jpg',
  })
  fileUrl!: string;

  @ApiProperty({
    description: 'Storage key for the file',
    example: 'products/uuid.jpg',
  })
  key!: string;
}

export class DeleteFileDto {
  @ApiProperty({
    description: 'Storage key or full URL of the file to delete',
    example: 'products/uuid.jpg',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;
}
