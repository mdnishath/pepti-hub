import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, tenantId: string) {
    // Check if product with slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        slug_tenantId: {
          slug: createProductDto.slug,
          tenantId,
        },
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: {
        sku_tenantId: {
          sku: createProductDto.sku,
          tenantId,
        },
      },
    });

    if (existingSku) {
      throw new ConflictException('Product with this SKU already exists');
    }

    // Verify category exists
    const category = await this.prisma.category.findFirst({
      where: {
        id: createProductDto.categoryId,
        tenantId,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        tenantId,
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 10,
    search?: string,
    categoryId?: string,
    isActive?: boolean,
    isFeatured?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string, tenantId: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        slug_tenantId: {
          slug,
          tenantId,
        },
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If category is being updated, verify it exists
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateProductDto.categoryId,
          tenantId,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
      },
    });

    return updatedProduct;
  }

  async remove(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  async updateStock(id: string, quantity: number, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });

    return updatedProduct;
  }
}
