import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Extract tenant from header (X-Tenant-ID) or subdomain
    let tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      // Try to extract from subdomain (e.g., tenant1.yourdomain.com)
      const host = request.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        // Look up tenant by slug
        const tenant = await this.prisma.tenant.findUnique({
          where: { slug: subdomain },
        });
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    }

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required. Provide X-Tenant-ID header.');
    }

    // Verify tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant ID');
    }

    if (!tenant.isActive) {
      throw new BadRequestException('Tenant is not active');
    }

    // Attach tenantId to request
    request.tenantId = tenantId;
    request.tenant = tenant;

    return next.handle();
  }
}
