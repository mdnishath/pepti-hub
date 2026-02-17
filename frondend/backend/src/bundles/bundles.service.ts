import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BundlesService {
  constructor(private prisma: PrismaService) {}

  async create(createBundleDto: CreateBundleDto, tenantId: string) {
    // Check if bundle with slug already exists
    const existingBundle = await this.prisma.bundle.findUnique({
      where: {
        slug_tenantId: {
          slug: createBundleDto.slug,
          tenantId,
        },
      },
    });

    if (existingBundle) {
      throw new ConflictException('Bundle with this slug already exists');
    }

    // Verify all products exist and belong to this tenant
    const productIds = createBundleDto.products.map(p => p.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Calculate pricing
    let originalPrice = new Decimal(0);
    for (const bundleProduct of createBundleDto.products) {
      const product = products.find(p => p.id === bundleProduct.productId);
      if (product) {
        originalPrice = originalPrice.add(
          new Decimal(product.price.toString()).mul(bundleProduct.quantity)
        );
      }
    }

    const discountAmount = originalPrice.mul(createBundleDto.discount).div(100);
    const finalPrice = originalPrice.sub(discountAmount);

    // Create bundle with products
    const bundle = await this.prisma.bundle.create({
      data: {
        name: createBundleDto.name,
        slug: createBundleDto.slug,
        description: createBundleDto.description,
        image: createBundleDto.image,
        discount: createBundleDto.discount,
        originalPrice,
        finalPrice,
        isActive: createBundleDto.isActive ?? true,
        tenantId,
        products: {
          create: createBundleDto.products.map(p => ({
            productId: p.productId,
            quantity: p.quantity,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return bundle;
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 10,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.BundleWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
    };

    const [bundles, total] = await Promise.all([
      this.prisma.bundle.findMany({
        where,
        skip,
        take: limit,
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bundle.count({ where }),
    ]);

    return {
      data: bundles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id, tenantId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return bundle;
  }

  async findBySlug(slug: string, tenantId: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: {
        slug_tenantId: {
          slug,
          tenantId,
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return bundle;
  }

  async update(id: string, updateBundleDto: UpdateBundleDto, tenantId: string) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id, tenantId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Prepare update data
    const updateData: any = {
      name: updateBundleDto.name,
      slug: updateBundleDto.slug,
      description: updateBundleDto.description,
      image: updateBundleDto.image,
      discount: updateBundleDto.discount,
      isActive: updateBundleDto.isActive,
    };

    // If products are being updated, recalculate pricing
    if (updateBundleDto.products) {
      // Verify all products exist
      const productIds = updateBundleDto.products.map(p => p.productId);
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          tenantId,
        },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('One or more products not found');
      }

      // Calculate new pricing
      let originalPrice = new Decimal(0);
      for (const bundleProduct of updateBundleDto.products) {
        const product = products.find(p => p.id === bundleProduct.productId);
        if (product) {
          originalPrice = originalPrice.add(
            new Decimal(product.price.toString()).mul(bundleProduct.quantity)
          );
        }
      }

      const discount = updateBundleDto.discount ?? bundle.discount;
      const discountAmount = originalPrice.mul(discount).div(100);
      const finalPrice = originalPrice.sub(discountAmount);

      updateData.originalPrice = originalPrice;
      updateData.finalPrice = finalPrice;

      // Delete existing bundle products and create new ones
      await this.prisma.bundleProduct.deleteMany({
        where: { bundleId: id },
      });

      updateData.products = {
        create: updateBundleDto.products.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
        })),
      };
    } else if (updateBundleDto.discount !== undefined && updateBundleDto.discount !== bundle.discount.toNumber()) {
      // If only discount is being updated, recalculate final price
      const discountAmount = bundle.originalPrice.mul(updateBundleDto.discount).div(100);
      const finalPrice = bundle.originalPrice.sub(discountAmount);
      updateData.finalPrice = finalPrice;
    }

    const updatedBundle = await this.prisma.bundle.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedBundle;
  }

  async remove(id: string, tenantId: string) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id, tenantId },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    await this.prisma.bundle.delete({
      where: { id },
    });

    return { message: 'Bundle deleted successfully' };
  }
}
