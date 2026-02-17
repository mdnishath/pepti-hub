# E-Commerce Backend Setup Guide

## Overview

This is a production-ready NestJS e-commerce backend with **white-label multi-tenancy** support. The system allows multiple tenants (clients) to have their own isolated stores while sharing the same infrastructure.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"
```

### 3. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start the Application
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api`
Swagger documentation: `http://localhost:3000/api/docs`

## Multi-Tenancy Setup

### How It Works

1. **Tenant Identification**:
   - Via `X-Tenant-ID` header in API requests
   - Or via subdomain (e.g., `tenant1.yourdomain.com`)

2. **Data Isolation**:
   - All database queries automatically filtered by `tenantId`
   - Users can only access data within their tenant

3. **Tenant Middleware**:
   - Validates tenant exists and is active
   - Attaches tenant info to request object

### Creating Your First Tenant

You'll need a Super Admin to create tenants. First, manually create a Super Admin user in the database or through Prisma Studio:

```bash
npx prisma studio
```

Then create a tenant using the API:

```bash
POST http://localhost:3000/api/tenants
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Acme Corporation",
  "slug": "acme",
  "email": "admin@acme.com",
  "primaryColor": "#3b82f6",
  "currency": "USD",
  "taxRate": 10
}
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /auth/register` - Register new user (requires X-Tenant-ID)
- `POST /auth/login` - Login user (requires X-Tenant-ID)
- `GET /auth/me` - Get current user profile

### Tenants (`/api/tenants`) - Super Admin Only
- `POST /tenants` - Create new tenant
- `GET /tenants` - List all tenants
- `GET /tenants/:id` - Get tenant details
- `PATCH /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

### Users (`/api/users`) - Admin Only
- `POST /users` - Create user
- `GET /users` - List users (paginated)
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Categories (`/api/categories`)
- `POST /categories` - Create category (Admin)
- `GET /categories` - List categories (Public)
- `GET /categories/:id` - Get category (Public)
- `PATCH /categories/:id` - Update category (Admin)
- `DELETE /categories/:id` - Delete category (Admin)

### Products (`/api/products`)
- `POST /products` - Create product (Admin)
- `GET /products` - List products with filters (Public)
  - Query params: `page`, `limit`, `search`, `categoryId`, `isActive`, `isFeatured`
- `GET /products/:id` - Get product by ID (Public)
- `GET /products/slug/:slug` - Get product by slug (Public)
- `PATCH /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Cart (`/api/cart`)
- `POST /cart/items` - Add item to cart
- `GET /cart` - Get user's cart
- `PATCH /cart/items/:itemId` - Update cart item quantity
- `DELETE /cart/items/:itemId` - Remove item from cart
- `DELETE /cart` - Clear cart

### Orders (`/api/orders`)
- `POST /orders` - Create order from cart
- `GET /orders` - List orders (filtered by role)
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id` - Update order status (Admin)
- `POST /orders/:id/cancel` - Cancel order

## Role-Based Access Control

### Roles
1. **SUPER_ADMIN**: Platform owner, can manage all tenants
2. **ADMIN**: Tenant admin, can manage tenant's data
3. **CUSTOMER**: Regular user, can shop and place orders

### Role Permissions
- **Super Admin**: Full access to everything, including tenant management
- **Admin**: Manage users, products, categories, orders within their tenant
- **Customer**: Browse products, manage cart, place orders

### Using Roles in Controllers

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Get()
findAll() {
  // Only accessible by Admin and Super Admin
}
```

## Database Schema

### Key Models

- **Tenant**: White-label tenant configuration
- **User**: Users with tenant isolation
- **Category**: Product categories with hierarchy
- **Product**: Products with inventory tracking
- **Cart**: Shopping cart
- **CartItem**: Items in cart
- **Order**: Customer orders
- **OrderItem**: Items in order

### Multi-Tenant Relations

Every major model has a `tenantId` field that references the `Tenant` model:
- User belongs to Tenant
- Product belongs to Tenant
- Category belongs to Tenant
- Order belongs to Tenant

## Common Operations

### Creating a Product

```typescript
POST /api/products
Headers:
  Authorization: Bearer {admin_token}
  X-Tenant-ID: {tenant_id}
Body:
{
  "name": "Premium Laptop",
  "slug": "premium-laptop",
  "description": "High-performance laptop",
  "price": 1299.99,
  "sku": "LAPTOP-001",
  "stock": 50,
  "categoryId": "{category_id}",
  "images": ["image1.jpg", "image2.jpg"],
  "isActive": true,
  "isFeatured": true
}
```

### Placing an Order

```typescript
// 1. Add items to cart
POST /api/cart/items
Headers:
  Authorization: Bearer {user_token}
  X-Tenant-ID: {tenant_id}
Body:
{
  "productId": "{product_id}",
  "quantity": 2
}

// 2. Create order from cart
POST /api/orders
Headers:
  Authorization: Bearer {user_token}
  X-Tenant-ID: {tenant_id}
Body:
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

## Security Best Practices

1. **Change Default Secrets**: Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
2. **Use Strong Passwords**: Enforce strong password policies
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: All DTOs have validation rules
6. **SQL Injection Protection**: Prisma provides automatic protection

## Production Deployment

### Environment Variables

Required for production:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secure-secret
JWT_REFRESH_SECRET=another-super-secure-secret
CORS_ORIGIN=https://yourdomain.com
PORT=3000
```

### Build and Run

```bash
npm run build
npm run start:prod
```

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

Build and run:
```bash
docker build -t ecommerce-backend .
docker run -p 3000:3000 --env-file .env ecommerce-backend
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure X-Tenant-ID header is provided

### Tenant Not Found
- Verify tenant exists in database
- Check X-Tenant-ID value
- Ensure tenant is active

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Support

For issues or questions:
1. Check the Swagger documentation at `/api/docs`
2. Review this setup guide
3. Check the README.md for additional information

## License

This project is private and proprietary.
