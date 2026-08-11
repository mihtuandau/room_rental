import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { ALLOWED_IMAGE_FORMATS, IMAGE_MAX_BYTES } from './storage.constants';

interface CloudinaryImageResource {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  resource_type: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private uploadPreset?: string;

  constructor(private config: ConfigService) {
    this.cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME')!;
    this.apiKey = this.config.get<string>('CLOUDINARY_API_KEY')!;
    this.apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET')!;
    this.uploadPreset = this.config.get<string>('CLOUDINARY_UPLOAD_PRESET');

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  createUploadSignature(publicIdPrefix: string) {
    if (!this.uploadPreset) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured. Configure a Cloudinary upload preset.',
      );
    }
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${publicIdPrefix}/${randomUUID()}`;
    const allowedFormats = ALLOWED_IMAGE_FORMATS.join(',');
    const paramsToSign = {
      timestamp,
      public_id: publicId,
      overwrite: false,
      allowed_formats: allowedFormats,
      upload_preset: this.uploadPreset,
    };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      publicId,
      overwrite: false,
      allowedFormats,
      uploadPreset: this.uploadPreset,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  roomImagePrefix(userId: string, roomId: number) {
    return `rooms/${userId}/${roomId}`;
  }

  isOwnedRoomImagePublicId(publicId: string, userId: string, roomId: number) {
    return publicId.startsWith(`${this.roomImagePrefix(userId, roomId)}/`);
  }

  async verifyRoomImage(
    publicId: string,
    userId: string,
    roomId: number,
  ): Promise<{ key: string; url: string }> {
    if (!this.isOwnedRoomImagePublicId(publicId, userId, roomId)) {
      throw new BadRequestException('Invalid room image identifier.');
    }

    let asset: CloudinaryImageResource;
    try {
      asset = (await cloudinary.api.resource(publicId, {
        resource_type: 'image',
      })) as CloudinaryImageResource;
    } catch {
      throw new BadRequestException('Uploaded image could not be verified.');
    }

    const allowed = ALLOWED_IMAGE_FORMATS.includes(
      asset.format.toLowerCase() as (typeof ALLOWED_IMAGE_FORMATS)[number],
    );
    const valid =
      asset.public_id === publicId &&
      asset.resource_type === 'image' &&
      asset.secure_url.startsWith(
        `https://res.cloudinary.com/${this.cloudName}/image/upload/`,
      ) &&
      allowed &&
      asset.bytes <= IMAGE_MAX_BYTES;

    if (!valid) {
      await this.destroyAsset(publicId).catch(() => undefined);
      throw new BadRequestException(
        'Image must be JPG, PNG, or WebP and no larger than 5 MB.',
      );
    }

    return { key: asset.public_id, url: asset.secure_url };
  }

  async destroyAsset(publicId: string) {
    await cloudinary.uploader.destroy(publicId);
  }

  async importProviderAvatar(sourceUrl: string, userId: string) {
    let url: URL;
    try {
      url = new URL(sourceUrl);
    } catch {
      return null;
    }

    const trustedHost =
      url.protocol === 'https:' &&
      (url.hostname === 'lh3.googleusercontent.com' ||
        url.hostname === 'platform-lookaside.fbsbx.com' ||
        url.hostname.endsWith('.fbcdn.net'));
    if (!trustedHost || !this.cloudName || !this.apiSecret) return null;

    try {
      const asset = await cloudinary.uploader.upload(sourceUrl, {
        folder: `avatars/${userId}`,
        public_id: randomUUID(),
        overwrite: false,
        resource_type: 'image',
      });
      return asset.secure_url.startsWith(
        `https://res.cloudinary.com/${this.cloudName}/image/upload/`,
      )
        ? asset.secure_url
        : null;
    } catch {
      this.logger.warn(`Provider avatar import failed for user ${userId}.`);
      return null;
    }
  }

  warnLegacyAssetNotDestroyed(publicId: string, roomId: number) {
    this.logger.warn(
      `Skipped Cloudinary deletion for legacy unscoped image ${publicId} on room ${roomId}.`,
    );
  }
}
