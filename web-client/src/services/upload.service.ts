import api from './api';

export type UploadType = 
  | 'product-image' 
  | 'merchant-logo' 
  | 'merchant-banner' 
  | 'driver-avatar' 
  | 'user-avatar';

export interface PresignRequest {
  type: UploadType;
  filename: string;
  contentType: string;
  contentLength: number;
}

export interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadService = {
  /**
   * Request a presigned URL for upload
   */
  async getPresignedUrl(data: PresignRequest): Promise<PresignResponse> {
    const response = await api.post<PresignResponse>('/uploads/presign', data);
    return response.data;
  },

  /**
   * Upload file directly to storage using presigned URL
   */
  async uploadToStorage(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  },

  /**
   * Full upload flow: get presigned URL + upload file
   */
  async upload(
    file: File,
    type: UploadType,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Tipo de arquivo não permitido. Use: ${ALLOWED_TYPES.map((t) => t.split('/')[1]).join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: 5MB`);
    }

    // Get presigned URL
    const presign = await this.getPresignedUrl({
      type,
      filename: file.name,
      contentType: file.type,
      contentLength: file.size,
    });

    // Upload to storage
    await this.uploadToStorage(presign.uploadUrl, file, onProgress);

    // Return the public URL
    return presign.fileUrl;
  },

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    await api.delete('/uploads/file', { data: { key } });
  },

  /**
   * Validate a file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Use: ${ALLOWED_TYPES.map((t) => t.split('/')[1]).join(', ')}`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: 5MB`,
      };
    }

    return { valid: true };
  },
};

export default uploadService;
