import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, tenantId: string) {
    // Check if category with slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        slug_tenantId: {
          slug: createCategoryDto.slug,
          tenantId,
        },
      },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    // If parentId is provided, verify it exists
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: createCategoryDto.parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async findAll(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where: { tenantId } }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        products: {
          take: 10,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If parentId is being updated, verify it exists
    if (updateCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: updateCategoryDto.parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Prevent circular reference
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return updatedCategory;
  }

  async remove(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.products > 0) {
      throw new ConflictException('Cannot delete category with products');
    }

    if (category._count.children > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}
