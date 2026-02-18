import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function createTestMerchant() {
  try {
    const merchant = await prisma.merchant.create({
      data: {
        id: 'merchant_001',
        email: 'test@merchant.com',
        passwordHash: crypto.createHash('sha256').update('test123').digest('hex'),
        businessName: 'Test Merchant Store',
        apiKeyHash: crypto.createHash('sha256').update('test_api_key_123').digest('hex'),
        walletAddress: '0xTestMerchantWallet123456789',
        webhookUrl: 'https://webhook.site/test',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    console.log('✅ Test merchant created:', {
      id: merchant.id,
      email: merchant.email,
      businessName: merchant.businessName
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ Merchant already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestMerchant();
