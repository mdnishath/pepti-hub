// Quick script to fix merchant wallet address checksum
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function fixWalletAddress() {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: '564ce9fd-8a59-4a0a-926e-4942ea59ecb0' }
    });

    if (!merchant) {
      console.log('Merchant not found');
      return;
    }

    console.log('Current wallet:', merchant.walletAddress);

    // Normalize to proper checksum - first convert to lowercase, then use getAddress
    const lowercaseAddress = merchant.walletAddress.toLowerCase();
    console.log('Lowercase:', lowercaseAddress);
    const correctAddress = ethers.getAddress(lowercaseAddress);
    console.log('Correct wallet:', correctAddress);

    // Update in database
    await prisma.merchant.update({
      where: { id: '564ce9fd-8a59-4a0a-926e-4942ea59ecb0' },
      data: { walletAddress: correctAddress }
    });

    console.log('✅ Wallet address updated with correct checksum!');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixWalletAddress();
