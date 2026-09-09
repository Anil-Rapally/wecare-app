import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

@Injectable()
export class PhotoService {
  async sanitize(buffer: Buffer): Promise<Buffer> {
    if (!buffer?.length || buffer.length > MAX_PHOTO_BYTES) {
      throw new BadRequestException('Upload an image no larger than 2 MiB.');
    }
    try {
      const image = sharp(buffer, { limitInputPixels: 16_000_000, failOn: 'error' });
      const metadata = await image.metadata();
      if (
        !metadata.format ||
        !['jpeg', 'png', 'webp'].includes(metadata.format) ||
        (metadata.pages ?? 1) > 1
      )
        throw new Error('Unsupported image');
      // Decode actual bytes, correct orientation, resize, and drop EXIF metadata.
      return await image
        .rotate()
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'Upload a valid, non-animated JPEG, PNG, or WebP image (maximum 16 megapixels).',
      );
    }
  }
}
