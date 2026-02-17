import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityImageDto } from './dto/create-quality-image.dto';
import { UpdateQualityImageDto } from './dto/update-quality-image.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QualityImagesService {
  constructor(private prisma: PrismaService) {}

  async create(createQualityImageDto: CreateQualityImageDto, tenantId: string) {
    const qualityImage = await this.prisma.qualityImage.create({
      data: {
        ...createQualityImageDto,
        tenantId,
      },
    });

    return qualityImage;
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 10,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.QualityImageWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
    };

    const [qualityImages, total] = await Promise.all([
      this.prisma.qualityImage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      this.prisma.qualityImage.count({ where }),
    ]);

    return {
      data: qualityImages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const qualityImage = await this.prisma.qualityImage.findFirst({
      where: { id, tenantId },
    });

    if (!qualityImage) {
      throw new NotFoundException('Quality image not found');
    }

    return qualityImage;
  }

  async update(id: string, updateQualityImageDto: UpdateQualityImageDto, tenantId: string) {
    const qualityImage = await this.prisma.qualityImage.findFirst({
      where: { id, tenantId },
    });

    if (!qualityImage) {
      throw new NotFoundException('Quality image not found');
    }

    const updatedQualityImage = await this.prisma.qualityImage.update({
      where: { id },
      data: updateQualityImageDto,
    });

    return updatedQualityImage;
  }

  async remove(id: string, tenantId: string) {
    const qualityImage = await this.prisma.qualityImage.findFirst({
      where: { id, tenantId },
    });

    if (!qualityImage) {
      throw new NotFoundException('Quality image not found');
    }

    await this.prisma.qualityImage.delete({
      where: { id },
    });

    return { message: 'Quality image deleted successfully' };
  }

  async reorder(id: string, newOrder: number, tenantId: string) {
    const qualityImage = await this.prisma.qualityImage.findFirst({
      where: { id, tenantId },
    });

    if (!qualityImage) {
      throw new NotFoundException('Quality image not found');
    }

    const updatedQualityImage = await this.prisma.qualityImage.update({
      where: { id },
      data: { order: newOrder },
    });

    return updatedQualityImage;
  }
}
