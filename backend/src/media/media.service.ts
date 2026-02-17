import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(
    file: Express.Multer.File,
    tenantId: string,
    type?: MediaType,
  ) {
    // Determine media type from mime type if not provided
    let mediaType = type;
    if (!mediaType) {
      if (file.mimetype.startsWith('image/')) {
        mediaType = MediaType.IMAGE;
      } else if (file.mimetype.startsWith('video/')) {
        mediaType = MediaType.VIDEO;
      } else {
        throw new BadRequestException('Unsupported file type. Only images and videos are allowed.');
      }
    }

    // Create URL path for the file
    const url = `/uploads/${tenantId}/${file.filename}`;

    const media = await this.prisma.media.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        type: mediaType,
        tenantId,
      },
    });

    return media;
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    tenantId: string,
  ) {
    const mediaItems = await Promise.all(
      files.map((file) => this.create(file, tenantId)),
    );
    return mediaItems;
  }

  async findAll(tenantId: string, type?: MediaType) {
    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    const media = await this.prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return media;
  }

  async findOne(id: string, tenantId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, tenantId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async remove(id: string, tenantId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id, tenantId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Delete file from filesystem
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, tenantId, media.filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await this.prisma.media.delete({
      where: { id },
    });

    return { message: 'Media deleted successfully' };
  }
}
