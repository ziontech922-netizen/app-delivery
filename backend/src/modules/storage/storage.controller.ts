import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import { PresignUploadDto, PresignResponseDto, DeleteFileDto } from './dto';

@ApiTags('Uploads')
@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for upload' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated',
    type: PresignResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPresignedUrl(
    @Body() dto: PresignUploadDto,
  ): Promise<PresignResponseDto> {
    return this.storageService.generatePresignedUrl(
      dto.type,
      dto.filename,
      dto.contentType,
      dto.contentLength,
    );
  }

  @Delete('file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file from storage' })
  @ApiResponse({ status: 204, description: 'File deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(@Body() dto: DeleteFileDto): Promise<void> {
    // Extract key if full URL was provided
    const key = dto.key.startsWith('http')
      ? this.storageService.extractKeyFromUrl(dto.key)
      : dto.key;

    if (key) {
      await this.storageService.deleteFile(key);
    }
  }
}
