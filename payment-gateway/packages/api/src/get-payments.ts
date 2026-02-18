// Get payment details for settlement
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPayments() {
  try {
    const paymentIds = [
      '7229670b-4ece-43f0-ad0f-6b6cadbf462f',
      '5867a6e8-8149-4da1-a5c7-846341ab0b0c'
    ];

    for (const id of paymentIds) {
      const payment = await prisma.paymentOrder.findUnique({
        where: { id },
        select: {
          id: true,
          orderId: true,
          amount: true,
          netAmount: true,
          feeAmount: true,
          paymentAddress: true,
          status: true,
          transactions: {
            select: {
              txHash: true,
              confirmations: true
            }
          }
        }
      });

      if (payment) {
        console.log('\n-----------------------------------');
        console.log('Payment ID:', payment.id);
        console.log('Order ID:', payment.orderId);
        console.log('Amount:', payment.amount.toString(), 'USDT');
        console.log('Net Amount:', payment.netAmount.toString(), 'USDT');
        console.log('Fee:', payment.feeAmount.toString(), 'USDT');
        console.log('Payment Address:', payment.paymentAddress);
        console.log('Status:', payment.status);
        console.log('Transactions:', payment.transactions.length);
        if (payment.transactions.length > 0) {
          console.log('  TxHash:', payment.transactions[0].txHash);
          console.log('  Confirmations:', payment.transactions[0].confirmations);
        }
        console.log('\nBscScan:', `https://bscscan.com/address/${payment.paymentAddress}`);
      }
    }

    console.log('\n-----------------------------------\n');
    console.log('📝 To settle these payments:');
    console.log('1. Send 0.001 BNB to each payment address above');
    console.log('2. Wait 30 seconds for automatic settlement');
    console.log('3. Or manually trigger: curl -X POST http://localhost:3000/api/v1/admin/settlements/process');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getPayments();
