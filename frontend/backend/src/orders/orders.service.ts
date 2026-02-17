import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto, tenantId: string) {
    // Get user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Verify all products are available and in stock
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(`Product ${item.product.name} is not available`);
      }

      if (item.product.trackInventory && item.product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
      }
    }

    // Get tenant for tax rate
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const taxRate = Number(tenant.taxRate) / 100;
    const tax = subtotal * taxRate;
    const shipping = 0; // You can implement shipping calculation logic
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          tenantId,
          subtotal,
          tax,
          shipping,
          total,
          shippingAddress: createOrderDto.shippingAddress as any,
          billingAddress: createOrderDto.billingAddress as any,
          customerNote: createOrderDto.customerNote,
          paymentMethod: createOrderDto.paymentMethod,
        },
      });

      // Create order items and update stock
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            price: item.product.price,
            total: Number(item.product.price) * item.quantity,
          },
        });

        // Update stock if tracking is enabled
        if (item.product.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Get full order details with user info
    const fullOrder = await this.findOne(order.id, tenantId, userId);

    // Send email notification (non-blocking)
    // Uses tenant-specific SMTP if configured, otherwise falls back to global config
    this.emailService.sendOrderNotification({
      orderId: fullOrder.id,
      customerName: `${fullOrder.user.firstName} ${fullOrder.user.lastName}`,
      customerEmail: fullOrder.user.email,
      totalAmount: Number(fullOrder.total),
      itemCount: fullOrder.items.length,
      tenantName: tenant.name,
      tenantEmailFrom: tenant.emailFrom || undefined,
      tenantSmtpConfig: tenant.smtpConfig || undefined,
      tenantOrderEmail: tenant.orderNotificationEmail || undefined,
    }).catch(err => {
      this.logger.error(`Failed to send order email notification: ${err.message}`);
    });

    // Return order with items
    return fullOrder;
  }

  async findAll(
    tenantId: string,
    userId?: string,
    page = 1,
    limit = 10,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(userId && { userId }),
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string, userId?: string) {
    const where: any = { id, tenantId };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async cancelOrder(id: string, tenantId: string, userId?: string) {
    const where: any = { id, tenantId };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    // Update order status and restore stock in a transaction
    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Restore stock for each item
      for (const item of order.items) {
        // Skip if product was deleted (productId is null)
        if (!item.productId) continue;

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return updated;
    });

    return cancelledOrder;
  }
}
