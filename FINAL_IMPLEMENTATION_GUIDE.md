# 🎯 Final Implementation Guide - Complete Remaining Features

## ✅ What's Already Done:

1. GasFundingService.ts - Auto gas funding & recovery
2. Admin Panel - Dashboard, settlements
3. Platform Wallet - Access documented
4. All documentation files

---

## 🔧 What Needs to be Implemented:

### Feature 1: Deduct Gas Fee from Merchant Settlement

**File to Update**: `packages/api/src/services/SettlementService.ts`

**Current Logic** (Line 140-175):
```typescript
// Currently sends full netAmount to merchant
const netAmountWei = ethers.parseUnits(payment.netAmount.toString(), 18);
const merchantTx = await usdtContract.transfer(merchantAddress, netAmountWei);
```

**New Logic** (with gas deduction):
```typescript
// Calculate gas cost in USDT
const GAS_COST_BNB = 0.001; // Actual gas used
const BNB_PRICE_USD = 600; // Update from price oracle
const gasCostUSDT = GAS_COST_BNB * BNB_PRICE_USD; // ~$0.60

// Deduct gas from merchant amount
const merchantAmountAfterGas = parseFloat(payment.netAmount.toString()) - gasCostUSDT;
const merchantAmountWei = ethers.parseUnits(merchantAmountAfterGas.toFixed(4), 18);

// New fee breakdown:
// - Platform fee: 2.5 USDT
// - Gas cost: 0.6 USDT (deducted from merchant)
// - Merchant receives: 96.9 USDT

const merchantTx = await usdtContract.transfer(merchantAddress, merchantAmountWei);

// Platform gets: original fee + gas cost reimbursement
const platformFeeWei = ethers.parseUnits(payment.feeAmount.toString(), 18);
const gasCostWei = ethers.parseUnits(gasCostUSDT.toFixed(4), 18);
const totalPlatformAmount = platformFeeWei + gasCostWei;

const platformTx = await usdtContract.transfer(this.PLATFORM_WALLET, totalPlatformAmount);
```

**Steps:**
1. Read SettlementService.ts
2. Find settlement logic (around line 156)
3. Update with gas deduction
4. Test with one payment

---

### Feature 2: Unsettled Funds Recovery System

**Create New Service**: `packages/api/src/services/FundsRecoveryService.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { WalletService } from '@pptpay/blockchain';
import { ProviderService } from '@pptpay/blockchain';

export class FundsRecoveryService {
  private prisma: PrismaClient;
  private walletService: WalletService;
  private providerService: ProviderService;
  private platformWallet: ethers.HDNodeWallet;

  // USDT contract
  private readonly USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

  constructor(
    prisma: PrismaClient,
    walletService: WalletService,
    providerService: ProviderService
  ) {
    this.prisma = prisma;
    this.walletService = walletService;
    this.providerService = providerService;

    const provider = this.providerService.getProvider();
    this.platformWallet = this.walletService.getWallet(0, provider);

    console.log('[FundsRecoveryService] Initialized');
    console.log('[FundsRecoveryService] Platform wallet:', this.platformWallet.address);
  }

  /**
   * Get all unsettled payments with funds
   */
  async getUnsettledPayments(): Promise<any[]> {
    const payments = await this.prisma.paymentOrder.findMany({
      where: {
        status: {
          in: ['CREATED', 'PENDING', 'CONFIRMED']
        },
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
        }
      },
      include: {
        merchant: {
          select: {
            businessName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check balance for each
    const provider = this.providerService.getProvider();
    const usdtContract = new ethers.Contract(
      this.USDT_ADDRESS,
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );

    const paymentsWithBalance = [];

    for (const payment of payments) {
      const usdtBalance = await usdtContract.balanceOf(payment.paymentAddress);
      const bnbBalance = await provider.getBalance(payment.paymentAddress);

      if (usdtBalance > 0n || bnbBalance > 0n) {
        paymentsWithBalance.push({
          ...payment,
          balances: {
            usdt: ethers.formatUnits(usdtBalance, 18),
            bnb: ethers.formatEther(bnbBalance)
          }
        });
      }
    }

    return paymentsWithBalance;
  }

  /**
   * Recover funds from a specific payment address
   */
  async recoverFromAddress(paymentId: string): Promise<{
    success: boolean;
    usdtRecovered?: string;
    bnbRecovered?: string;
    txHashes?: string[];
    error?: string;
  }> {
    try {
      const payment = await this.prisma.paymentOrder.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      const provider = this.providerService.getProvider();
      const paymentWallet = this.walletService.getWallet(payment.addressIndex, provider);

      console.log(`[FundsRecovery] Recovering from: ${paymentWallet.address}`);

      // Check balances
      const usdtContract = new ethers.Contract(
        this.USDT_ADDRESS,
        [
          'function balanceOf(address) view returns (uint256)',
          'function transfer(address to, uint256 amount) returns (bool)'
        ],
        paymentWallet
      );

      const usdtBalance = await usdtContract.balanceOf(paymentWallet.address);
      const bnbBalance = await provider.getBalance(paymentWallet.address);

      console.log(`[FundsRecovery] USDT: ${ethers.formatUnits(usdtBalance, 18)}`);
      console.log(`[FundsRecovery] BNB: ${ethers.formatEther(bnbBalance)}`);

      const txHashes: string[] = [];

      // Recover USDT if any
      let usdtRecovered = '0';
      if (usdtBalance > 0n) {
        console.log('[FundsRecovery] Transferring USDT to platform wallet...');
        const usdtTx = await usdtContract.transfer(
          this.platformWallet.address,
          usdtBalance
        );
        const usdtReceipt = await usdtTx.wait();
        txHashes.push(usdtReceipt.hash);
        usdtRecovered = ethers.formatUnits(usdtBalance, 18);
        console.log(`[FundsRecovery] ✅ USDT recovered: ${usdtRecovered}`);
      }

      // Recover BNB if any (after USDT to have gas)
      let bnbRecovered = '0';
      if (bnbBalance > ethers.parseEther('0.0001')) {
        // Estimate gas for BNB transfer
        const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('3', 'gwei');
        const gasCost = gasPrice * 21000n;
        const bnbToRecover = bnbBalance - gasCost;

        if (bnbToRecover > 0n) {
          console.log('[FundsRecovery] Transferring BNB to platform wallet...');
          const bnbTx = await paymentWallet.sendTransaction({
            to: this.platformWallet.address,
            value: bnbToRecover,
            gasPrice: gasPrice
          });
          const bnbReceipt = await bnbTx.wait();
          txHashes.push(bnbReceipt.hash);
          bnbRecovered = ethers.formatEther(bnbToRecover);
          console.log(`[FundsRecovery] ✅ BNB recovered: ${bnbRecovered}`);
        }
      }

      // Mark as recovered in database (optional: add status field)
      console.log(`[FundsRecovery] ✅ Recovery complete for ${paymentId}`);

      return {
        success: true,
        usdtRecovered,
        bnbRecovered,
        txHashes
      };
    } catch (error: any) {
      console.error('[FundsRecovery] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recover funds from all unsettled payments
   */
  async recoverAll(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    totalUSDT: string;
    totalBNB: string;
    results: any[];
  }> {
    const unsettledPayments = await this.getUnsettledPayments();

    console.log(`[FundsRecovery] Found ${unsettledPayments.length} unsettled payments with funds`);

    const results = [];
    let successful = 0;
    let failed = 0;
    let totalUSDT = 0;
    let totalBNB = 0;

    for (const payment of unsettledPayments) {
      const result = await this.recoverFromAddress(payment.id);

      if (result.success) {
        successful++;
        totalUSDT += parseFloat(result.usdtRecovered || '0');
        totalBNB += parseFloat(result.bnbRecovered || '0');
      } else {
        failed++;
      }

      results.push({
        paymentId: payment.id,
        orderId: payment.orderId,
        result
      });

      // Wait 2 seconds between recoveries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`[FundsRecovery] ✅ Recovery complete!`);
    console.log(`[FundsRecovery] Processed: ${unsettledPayments.length}`);
    console.log(`[FundsRecovery] Successful: ${successful}`);
    console.log(`[FundsRecovery] Failed: ${failed}`);
    console.log(`[FundsRecovery] Total USDT: ${totalUSDT.toFixed(4)}`);
    console.log(`[FundsRecovery] Total BNB: ${totalBNB.toFixed(4)}`);

    return {
      processed: unsettledPayments.length,
      successful,
      failed,
      totalUSDT: totalUSDT.toFixed(4),
      totalBNB: totalBNB.toFixed(4),
      results
    };
  }
}
```

**Steps:**
1. Create the file: `packages/api/src/services/FundsRecoveryService.ts`
2. Copy code above
3. Initialize in `packages/api/src/index.ts`
4. Add admin API routes

---

### Feature 3: Admin API Routes for Recovery

**Add to**: `packages/api/src/routes/admin.ts`

```typescript
/**
 * GET /api/v1/admin/recovery/unsettled
 * Get all unsettled payments with funds
 */
router.get('/recovery/unsettled', async (req: Request, res: Response) => {
  try {
    const unsettledPayments = await fundsRecoveryService.getUnsettledPayments();

    res.json({
      count: unsettledPayments.length,
      data: unsettledPayments
    });
  } catch (error: any) {
    console.error('[Admin] Get unsettled error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/admin/recovery/recover-all
 * Recover funds from all unsettled payments
 */
router.post('/recovery/recover-all', async (req: Request, res: Response) => {
  try {
    const result = await fundsRecoveryService.recoverAll();

    res.json({
      message: 'Funds recovery completed',
      result
    });
  } catch (error: any) {
    console.error('[Admin] Recover all error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
```

---

### Feature 4: Admin Panel Recovery Tab

**Add to**: `packages/dashboard/app/(dashboard)/admin/page.tsx`

Add a new section after the settlements table:

```typescript
{/* Funds Recovery Section */}
<div className="card mt-8">
  <h3 className="text-lg font-semibold mb-4 text-orange-900">
    🔄 Lost Funds Recovery
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    Recover USDT and BNB from unsettled/abandoned payment addresses and transfer to platform wallet for development.
  </p>

  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-orange-900">
          Unsettled Payments with Funds
        </p>
        <p className="text-2xl font-bold text-orange-600 mt-1">
          {unsettledCount} addresses
        </p>
      </div>
      <button
        onClick={handleRecoverAll}
        className="btn bg-orange-600 text-white hover:bg-orange-700"
      >
        Recover All Funds
      </button>
    </div>
  </div>

  <p className="text-xs text-gray-500">
    ⚡ This will transfer all USDT and BNB from abandoned payment addresses to the platform wallet (0xAB54...1443) for gateway development funding.
  </p>
</div>
```

---

## 🎯 Implementation Order:

### Step 1: Test Current System (5 min)
```bash
# 1. Check admin panel works
http://localhost:3001/admin

# 2. Check API works
curl http://localhost:3000/api/v1/admin/dashboard -H "Authorization: Bearer admin_ppt_..."

# 3. Check platform wallet balance
# MetaMask import করে দেখুন
```

### Step 2: Implement Gas Deduction (30 min)
1. Edit SettlementService.ts
2. Add gas cost calculation
3. Deduct from merchant amount
4. Test with one settlement

### Step 3: Implement Funds Recovery (1 hour)
1. Create FundsRecoveryService.ts
2. Add admin API routes
3. Test recovery on one address

### Step 4: Add Admin Panel UI (30 min)
1. Add recovery tab to admin panel
2. Add "Recover All" button
3. Show unsettled payments count

### Step 5: Full Test (30 min)
1. Recover all unsettled funds
2. Check platform wallet balance
3. Verify development funds collected

---

## 💰 Expected Results:

### After Implementation:

**Settlement Flow:**
```
Customer pays: 100 USDT
Platform fee: 2.5 USDT
Gas cost: 0.6 USDT (deducted from merchant)
Merchant receives: 96.9 USDT ✅
Platform receives: 3.1 USDT (2.5 fee + 0.6 gas) ✅
```

**Unsettled Recovery:**
```
Found 20 unsettled addresses
Total USDT: 15.5 USDT
Total BNB: 0.025 BNB

Recovered to platform wallet ✅
For gateway development ✅
```

---

## 📝 Quick Commands:

```bash
# Get platform wallet key
cd payment-gateway/packages/api
npx tsx -e "import { ethers } from 'ethers'; const m = 'chalk eight market lion spy virtual general you gallery cruel eternal wood'; const w = ethers.HDNodeWallet.fromPhrase(m).deriveChild(0); console.log('Address:', w.address); console.log('Key:', w.privateKey);"

# Check platform wallet balance on BscScan
https://bscscan.com/address/0xAB5466e8F022D69Fefd36bab3fF226908BeD1443

# Withdraw from platform wallet (MetaMask)
# Import seed phrase → Send USDT to personal wallet
```

---

## ✅ Summary:

1. **Gas Deduction** - Merchant pays gas, platform profit ↑
2. **Funds Recovery** - Lost funds → Platform wallet → Development
3. **Admin Control** - One-click recover all unsettled funds

**All features designed!** Ready to implement! 🚀
