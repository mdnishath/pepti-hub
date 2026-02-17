import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    // Check if tenant with slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    // Check if domain is provided and already exists
    if (createTenantDto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: createTenantDto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Tenant with this domain already exists');
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: createTenantDto,
    });

    return tenant;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Exclude sensitive data from public endpoint
    const { stripeKey, sslcommerzKey, smtpConfig, ...publicTenantData } = tenant;

    return publicTenantData;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if domain is being updated and already exists
    if (updateTenantDto.domain && updateTenantDto.domain !== tenant.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: updateTenantDto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Tenant with this domain already exists');
      }
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });

    return updatedTenant;
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.delete({
      where: { id },
    });

    return { message: 'Tenant deleted successfully' };
  }
}
