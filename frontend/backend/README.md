<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Production-ready NestJS e-commerce backend with **white-label multi-tenancy** support. Built for scalability, security, and flexibility.

## Features

- **White-Label Multi-Tenancy**: Support multiple tenants with isolated data
- **Complete E-Commerce**: Products, Categories, Cart, Orders
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Super Admin, Admin, and Customer roles
- **Tenant Isolation**: All data queries automatically scoped to tenant
- **API Documentation**: Swagger/OpenAPI auto-generated documentation
- **Validation**: DTO validation with class-validator
- **Error Handling**: Global exception filters
- **Database**: Prisma ORM with PostgreSQL

## Architecture

### Multi-Tenancy Strategy
- Tenant identification via `X-Tenant-ID` header or subdomain
- All database queries automatically filtered by tenantId
- Tenant middleware validates and attaches tenant to requests
- Each tenant can have custom branding (logo, colors)

### Modules
- **Auth**: Registration, Login, JWT tokens
- **Users**: User management with CRUD operations
- **Tenants**: White-label tenant management (Super Admin only)
- **Categories**: Product categories with hierarchy
- **Products**: Product management with search, filtering, pagination
- **Cart**: Shopping cart functionality
- **Orders**: Order creation, management, and cancellation

## Project setup

```bash
$ npm install
```

## Database Setup

1. Copy `.env.example` to `.env`:
```bash
$ cp .env.example .env
```

2. Update the `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"
```

3. Run Prisma migrations:
```bash
$ npx prisma generate
$ npx prisma migrate dev --name init
```

4. (Optional) Seed the database:
```bash
$ npx prisma db seed
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/api/docs
```

## Usage Examples

### 1. Create a Tenant (Super Admin)
```bash
POST /api/tenants
Headers:
  - Authorization: Bearer {super_admin_token}
Body:
{
  "name": "Acme Corp",
  "slug": "acme",
  "email": "admin@acme.com"
}
```

### 2. Register a User
```bash
POST /api/auth/register
Headers:
  - X-Tenant-ID: {tenant_id}
Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 3. Login
```bash
POST /api/auth/login
Headers:
  - X-Tenant-ID: {tenant_id}
Body:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 4. Create Product (Admin)
```bash
POST /api/products
Headers:
  - Authorization: Bearer {admin_token}
  - X-Tenant-ID: {tenant_id}
Body:
{
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Latest iPhone",
  "price": 999.99,
  "sku": "IP15PRO",
  "stock": 100,
  "categoryId": "{category_id}",
  "images": ["url1.jpg", "url2.jpg"]
}
```

### 5. Add to Cart
```bash
POST /api/cart/items
Headers:
  - Authorization: Bearer {user_token}
  - X-Tenant-ID: {tenant_id}
Body:
{
  "productId": "{product_id}",
  "quantity": 2
}
```

### 6. Create Order
```bash
POST /api/orders
Headers:
  - Authorization: Bearer {user_token}
  - X-Tenant-ID: {tenant_id}
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
  }
}
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Application port (default: 3000)
- `CORS_ORIGIN`: Allowed CORS origins

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
