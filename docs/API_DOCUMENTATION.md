# PeptiPay Gateway API Documentation

## Overview

PeptiPay is a cryptocurrency payment gateway built on Binance Smart Chain (BSC) that allows merchants to accept USDT payments with automatic fee calculation, real-time transaction monitoring, and QR code generation.

## Base URL

```
Development: http://localhost:3000
Production: TBD
```

## Authentication

The API uses two authentication methods:

### 1. API Key Authentication (for payment creation)
```http
X-API-Key: ppt_[64-character-hex-string]
```

### 2. JWT Bearer Token (for merchant dashboard)
```http
Authorization: Bearer [jwt-token]
```

---

## Merchant Endpoints

### Register Merchant

Create a new merchant account.

**Endpoint:** `POST /api/v1/merchants/register`

**Request Body:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePass123!",
  "businessName": "My Store",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}
```

**Validation:**
- Email: Valid email format
- Password: Minimum 8 characters
- Wallet Address: Valid Ethereum address (0x + 40 hex characters)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "564ce9fd-8a59-4a0a-926e-4942ea59ecb0",
      "email": "merchant@example.com",
      "businessName": "My Store",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "apiKey": "ppt_204f0c894959e43cce92acce0aefd9d4417223a78d02f726d83b34c9d388b377"
  }
}
```

**Note:** The API key is shown only once during registration. Save it securely!

---

### Login Merchant

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/v1/merchants/login`

**Request Body:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "564ce9fd-8a59-4a0a-926e-4942ea59ecb0",
      "email": "merchant@example.com",
      "businessName": "My Store",
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Merchant Profile

Get current merchant's profile information.

**Endpoint:** `GET /api/v1/merchants/me`

**Authentication:** JWT Bearer Token (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "564ce9fd-8a59-4a0a-926e-4942ea59ecb0",
    "email": "merchant@example.com",
    "businessName": "My Store",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "coldWalletAddress": null,
    "webhookUrl": null,
    "feePercentage": 2.5,
    "status": "ACTIVE",
    "emailVerified": false,
    "twoFactorEnabled": false,
    "createdAt": "2026-02-17T19:19:19.937Z",
    "updatedAt": "2026-02-17T19:19:19.937Z"
  }
}
```

---

### Get Merchant Statistics

Get merchant's payment statistics.

**Endpoint:** `GET /api/v1/merchants/stats`

**Authentication:** JWT Bearer Token (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPayments": 5,
    "successfulPayments": 2,
    "totalRevenue": "243.75",
    "todayRevenue": "48.75",
    "successRate": "40.00%"
  }
}
```

---

### Get Payment History

Get paginated list of merchant's payments.

**Endpoint:** `GET /api/v1/merchants/payments`

**Authentication:** JWT Bearer Token (required)

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Example:** `GET /api/v1/merchants/payments?page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "56ddb90b-4e25-45ea-98cb-4b886a679048",
        "orderId": "test_qr_001",
        "amount": "50",
        "feeAmount": "1.25",
        "netAmount": "48.75",
        "currency": "USDT",
        "paymentAddress": "0x66238c711Ba5f0416c2330750704206c6E3ebC99",
        "status": "CREATED",
        "createdAt": "2026-02-17T19:36:56.013Z",
        "expiresAt": "2026-02-17T19:51:56.002Z",
        "confirmedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### Regenerate API Key

Generate a new API key (invalidates the old one).

**Endpoint:** `POST /api/v1/merchants/api-key/regenerate`

**Authentication:** JWT Bearer Token (required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "apiKey": "ppt_a1b2c3d4e5f6...",
    "message": "API key regenerated successfully. Save this key securely, it will not be shown again."
  }
}
```

---

## Payment Endpoints

### Create Payment

Create a new payment order.

**Endpoint:** `POST /api/v1/payments`

**Authentication:** API Key (X-API-Key header, required)

**Request Body:**
```json
{
  "orderId": "order_12345",
  "amount": "100.50",
  "currency": "USDT",
  "returnUrl": "https://yourstore.com/checkout/success",
  "callbackUrl": "https://yourstore.com/webhooks/pptpay",
  "metadata": {
    "customerId": "cust_123",
    "productId": "prod_456"
  }
}
```

**Field Descriptions:**
- `orderId` (required): Your unique order identifier
- `amount` (required): Payment amount as string
- `currency` (required): Currently only "USDT" supported
- `returnUrl` (optional): URL to redirect user after payment
- `callbackUrl` (optional): Webhook URL for payment notifications
- `metadata` (optional): Custom data to store with payment

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "56ddb90b-4e25-45ea-98cb-4b886a679048",
    "orderId": "order_12345",
    "amount": "100.50",
    "feeAmount": "2.5125",
    "netAmount": "97.9875",
    "currency": "USDT",
    "paymentAddress": "0x66238c711Ba5f0416c2330750704206c6E3ebC99",
    "status": "CREATED",
    "expiresAt": "2026-02-17T19:51:56.002Z",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**QR Code:** The `qrCode` field contains a base64-encoded PNG image that users can scan with their crypto wallets.

**Payment Status Values:**
- `CREATED` - Payment order created, awaiting transaction
- `PENDING` - Transaction detected, awaiting confirmations
- `CONFIRMED` - Payment confirmed (12+ confirmations)
- `SETTLED` - Funds transferred to merchant wallet
- `EXPIRED` - Payment expired (15 minutes)
- `FAILED` - Payment failed

---

### Get Payment Details

Get details of a specific payment.

**Endpoint:** `GET /api/v1/payments/:id`

**Authentication:** API Key (X-API-Key header, required)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "56ddb90b-4e25-45ea-98cb-4b886a679048",
    "orderId": "order_12345",
    "amount": "100.50",
    "feeAmount": "2.5125",
    "netAmount": "97.9875",
    "currency": "USDT",
    "paymentAddress": "0x66238c711Ba5f0416c2330750704206c6E3ebC99",
    "status": "CONFIRMED",
    "expiresAt": "2026-02-17T19:51:56.002Z"
  }
}
```

---

## Webhook Notifications

When a payment status changes, PeptiPay sends a POST request to your `callbackUrl`.

**Webhook Payload:**
```json
{
  "event": "payment.confirmed",
  "timestamp": "2026-02-17T19:45:00.000Z",
  "data": {
    "paymentId": "56ddb90b-4e25-45ea-98cb-4b886a679048",
    "orderId": "order_12345",
    "status": "CONFIRMED",
    "amount": "100.50",
    "currency": "USDT",
    "transactionHash": "0xabc123...",
    "confirmations": 12
  }
}
```

**Webhook Events:**
- `payment.pending` - Transaction detected
- `payment.confirmed` - Payment confirmed (12+ confirmations)
- `payment.settled` - Funds transferred to merchant
- `payment.expired` - Payment expired
- `payment.failed` - Payment failed

**Webhook Security:**
- Verify the signature in `X-Signature` header
- Verify the timestamp to prevent replay attacks
- Return 200 OK to acknowledge receipt

---

## Fee Structure

PeptiPay charges a **2.5% platform fee** on all successful payments.

**Example Calculation:**
```
Payment Amount: $100.00 USDT
Platform Fee (2.5%): $2.50 USDT
Net Amount (to merchant): $97.50 USDT
```

The fee is automatically calculated and deducted. Merchants receive the `netAmount`.

---

## Rate Limits

- **Authentication endpoints:** 10 requests per minute per IP
- **Payment creation:** 60 requests per minute per merchant
- **Other endpoints:** 120 requests per minute per merchant

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Bad Request",
  "message": "Missing required fields: orderId, amount, currency"
}
```

**Common HTTP Status Codes:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Account suspended or insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Email already registered
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Testing

### Testnet Configuration

PeptiPay currently runs on **BSC Testnet** for testing.

**Network Details:**
- Network: BSC Testnet
- Chain ID: 97
- RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
- Block Explorer: https://testnet.bscscan.com
- USDT Token: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd

**Getting Testnet Tokens:**
1. Get testnet BNB from: https://testnet.binance.org/faucet-smart
2. Get testnet USDT from: [Testnet Faucet]

---

## SDK Examples

### Node.js/JavaScript

```javascript
const axios = require('axios');

const PPTPAY_API_KEY = 'ppt_your_api_key_here';
const PPTPAY_BASE_URL = 'http://localhost:3000/api/v1';

// Create a payment
async function createPayment() {
  try {
    const response = await axios.post(
      `${PPTPAY_BASE_URL}/payments`,
      {
        orderId: `order_${Date.now()}`,
        amount: '50.00',
        currency: 'USDT',
        returnUrl: 'https://mystore.com/success',
        callbackUrl: 'https://mystore.com/webhook'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': PPTPAY_API_KEY
        }
      }
    );

    console.log('Payment created:', response.data);
    // Display QR code: response.data.data.qrCode
    // Payment address: response.data.data.paymentAddress

    return response.data.data;
  } catch (error) {
    console.error('Error creating payment:', error.response?.data);
    throw error;
  }
}

// Check payment status
async function checkPayment(paymentId) {
  try {
    const response = await axios.get(
      `${PPTPAY_BASE_URL}/payments/${paymentId}`,
      {
        headers: {
          'X-API-Key': PPTPAY_API_KEY
        }
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error checking payment:', error.response?.data);
    throw error;
  }
}

createPayment().then(payment => {
  console.log('Created payment:', payment.id);
  console.log('Send USDT to:', payment.paymentAddress);
});
```

### Python

```python
import requests
import json

PPTPAY_API_KEY = 'ppt_your_api_key_here'
PPTPAY_BASE_URL = 'http://localhost:3000/api/v1'

def create_payment():
    """Create a payment order"""
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': PPTPAY_API_KEY
    }

    payload = {
        'orderId': f'order_{int(time.time())}',
        'amount': '50.00',
        'currency': 'USDT',
        'returnUrl': 'https://mystore.com/success',
        'callbackUrl': 'https://mystore.com/webhook'
    }

    response = requests.post(
        f'{PPTPAY_BASE_URL}/payments',
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        payment = response.json()['data']
        print(f"Payment created: {payment['id']}")
        print(f"Payment address: {payment['paymentAddress']}")
        print(f"QR Code: {payment['qrCode'][:50]}...")
        return payment
    else:
        print(f"Error: {response.json()}")
        return None

# Create payment
payment = create_payment()
```

---

## Support

For technical support or questions:
- Email: support@peptipay.com
- Documentation: https://docs.peptipay.com
- Discord: https://discord.gg/peptipay

---

## Changelog

### Version 1.0.0 (2026-02-17)
- Initial release
- Merchant registration and authentication
- Payment creation with API keys
- Real-time transaction monitoring
- QR code generation
- Merchant dashboard statistics
- Payment history with pagination
- Webhook notifications
