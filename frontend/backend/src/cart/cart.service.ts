import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(userId: string, addToCartDto: AddToCartDto, tenantId: string) {
    // Verify product exists and is active
    const product = await this.prisma.product.findFirst({
      where: {
        id: addToCartDto.productId,
        tenantId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    // Check stock availability
    if (product.trackInventory && product.stock < addToCartDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Get or create cart for user
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          tenantId,
        },
      });
    }

    // Check if product already in cart
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addToCartDto.productId,
        },
      },
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + addToCartDto.quantity;

      // Check stock for new quantity
      if (product.trackInventory && product.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }

      await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item to cart
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: addToCartDto.productId,
          quantity: addToCartDto.quantity,
        },
      });
    }

    return this.getCart(userId, tenantId);
  }

  async getCart(userId: string, tenantId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return {
        items: [],
        itemCount: 0,
        subtotal: 0,
      };
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: cart.id,
      items: cart.items,
      itemCount,
      subtotal,
    };
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
    tenantId: string,
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability
    if (
      cartItem.product.trackInventory &&
      cartItem.product.stock < updateCartItemDto.quantity
    ) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
    });

    return this.getCart(userId, tenantId);
  }

  async removeFromCart(userId: string, itemId: string, tenantId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId, tenantId);
  }

  async clearCart(userId: string, tenantId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }
}
