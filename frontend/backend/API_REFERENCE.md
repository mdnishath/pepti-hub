# API Reference

Base URL: `http://localhost:3000/api`

All endpoints (except public ones) require:
- `Authorization: Bearer {token}` header
- `X-Tenant-ID: {tenant_id}` header

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json
X-Tenant-ID: {tenant_id}

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}

Response: 201 Created
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json
X-Tenant-ID: {tenant_id}

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

## Tenants (Super Admin Only)

### Create Tenant
```http
POST /tenants
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Acme Corp",
  "slug": "acme",
  "email": "admin@acme.com",
  "domain": "acme.com",
  "primaryColor": "#3b82f6",
  "currency": "USD",
  "taxRate": 10
}

Response: 201 Created
```

### List Tenants
```http
GET /tenants?page=1&limit=10
Authorization: Bearer {super_admin_token}

Response: 200 OK
{
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Get Tenant
```http
GET /tenants/{id}
Authorization: Bearer {super_admin_token}

Response: 200 OK
```

### Update Tenant
```http
PATCH /tenants/{id}
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "primaryColor": "#ff0000"
}

Response: 200 OK
```

## Users (Admin Only)

### Create User
```http
POST /users
Authorization: Bearer {admin_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ADMIN"
}

Response: 201 Created
```

### List Users
```http
GET /users?page=1&limit=10
Authorization: Bearer {admin_token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "data": [...],
  "meta": { ... }
}
```

## Categories

### Create Category (Admin)
```http
POST /categories
Authorization: Bearer {admin_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices",
  "image": "https://example.com/image.jpg",
  "parentId": null
}

Response: 201 Created
```

### List Categories (Public)
```http
GET /categories?page=1&limit=10
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "data": [
    {
      "id": "...",
      "name": "Electronics",
      "slug": "electronics",
      "parent": null,
      "children": [...],
      "_count": {
        "products": 25
      }
    }
  ],
  "meta": { ... }
}
```

### Get Category (Public)
```http
GET /categories/{id}
X-Tenant-ID: {tenant_id}

Response: 200 OK
```

## Products

### Create Product (Admin)
```http
POST /products
Authorization: Bearer {admin_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Latest iPhone with advanced features",
  "price": 999.99,
  "compareAtPrice": 1099.99,
  "sku": "IP15PRO-001",
  "stock": 100,
  "trackInventory": true,
  "lowStockThreshold": 10,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "thumbnail": "https://example.com/thumb.jpg",
  "categoryId": "{category_id}",
  "isActive": true,
  "isFeatured": true,
  "metaTitle": "Buy iPhone 15 Pro",
  "metaDescription": "Get the latest iPhone..."
}

Response: 201 Created
```

### List Products (Public)
```http
GET /products?page=1&limit=10&search=iphone&categoryId={id}&isActive=true&isFeatured=true
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "data": [
    {
      "id": "...",
      "name": "iPhone 15 Pro",
      "slug": "iphone-15-pro",
      "price": 999.99,
      "stock": 100,
      "images": [...],
      "category": {
        "id": "...",
        "name": "Electronics"
      }
    }
  ],
  "meta": { ... }
}
```

### Get Product by ID (Public)
```http
GET /products/{id}
X-Tenant-ID: {tenant_id}

Response: 200 OK
```

### Get Product by Slug (Public)
```http
GET /products/slug/{slug}
X-Tenant-ID: {tenant_id}

Response: 200 OK
```

### Update Product (Admin)
```http
PATCH /products/{id}
Authorization: Bearer {admin_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "price": 899.99,
  "stock": 150
}

Response: 200 OK
```

## Cart

### Add to Cart
```http
POST /cart/items
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "productId": "{product_id}",
  "quantity": 2
}

Response: 201 Created
{
  "id": "...",
  "items": [
    {
      "id": "...",
      "quantity": 2,
      "product": {
        "id": "...",
        "name": "iPhone 15 Pro",
        "price": 999.99,
        "images": [...]
      }
    }
  ],
  "itemCount": 2,
  "subtotal": 1999.98
}
```

### Get Cart
```http
GET /cart
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "id": "...",
  "items": [...],
  "itemCount": 3,
  "subtotal": 2999.97
}
```

### Update Cart Item
```http
PATCH /cart/items/{itemId}
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "quantity": 5
}

Response: 200 OK
```

### Remove from Cart
```http
DELETE /cart/items/{itemId}
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
```

### Clear Cart
```http
DELETE /cart
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "message": "Cart cleared successfully"
}
```

## Orders

### Create Order
```http
POST /orders
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "billingAddress": {
    // Same structure as shippingAddress (optional)
  },
  "customerNote": "Please deliver before 5 PM",
  "paymentMethod": "credit_card"
}

Response: 201 Created
{
  "id": "...",
  "orderNumber": "ORD-1234567890-abc",
  "status": "PENDING",
  "paymentStatus": "UNPAID",
  "subtotal": 1999.98,
  "tax": 199.99,
  "shipping": 10.00,
  "total": 2209.97,
  "items": [
    {
      "id": "...",
      "productName": "iPhone 15 Pro",
      "sku": "IP15PRO-001",
      "quantity": 2,
      "price": 999.99,
      "total": 1999.98
    }
  ],
  "shippingAddress": { ... }
}
```

### List Orders
```http
GET /orders?page=1&limit=10&status=PENDING
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "data": [
    {
      "id": "...",
      "orderNumber": "ORD-...",
      "status": "PENDING",
      "total": 2209.97,
      "items": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { ... }
}
```

### Get Order
```http
GET /orders/{id}
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
```

### Update Order (Admin)
```http
PATCH /orders/{id}
Authorization: Bearer {admin_token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json

{
  "status": "SHIPPED",
  "trackingNumber": "TRACK123456",
  "adminNote": "Shipped via FedEx"
}

Response: 200 OK
```

### Cancel Order
```http
POST /orders/{id}/cancel
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

Response: 200 OK
{
  "id": "...",
  "status": "CANCELLED"
}
```

## Enums

### OrderStatus
- `PENDING`
- `CONFIRMED`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`
- `REFUNDED`

### PaymentStatus
- `UNPAID`
- `PAID`
- `PARTIALLY_PAID`
- `REFUNDED`
- `FAILED`

### Role
- `SUPER_ADMIN`
- `ADMIN`
- `CUSTOMER`

### Plan
- `BASIC`
- `PRO`
- `ENTERPRISE`

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/products",
  "method": "POST",
  "message": "Validation failed"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Product with this slug already exists"
}
```

## Pagination

All list endpoints support pagination:
```
?page=1&limit=10
```

Response includes meta information:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Rate Limiting

Recommended rate limits (to be implemented):
- Auth endpoints: 5 requests per minute
- Public endpoints: 100 requests per minute
- Authenticated endpoints: 200 requests per minute

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3000/api/docs
```

Features:
- Try out endpoints directly
- View request/response schemas
- Test authentication
- See all available endpoints
