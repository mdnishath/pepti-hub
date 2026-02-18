# UI/UX Design Specifications

## Design Philosophy

### Core Principles
1. **Simplicity First**: 2 clicks maximum to complete payment
2. **Trust Building**: Clear, transparent pricing and status
3. **Mobile-First**: 60% of crypto users are on mobile
4. **Speed**: Every second counts in checkout flow
5. **Accessibility**: WCAG 2.1 AA compliant
6. **Familiarity**: Look like a professional payment processor (not crypto-nerd focused)

### Visual Identity

**Brand Colors**:
```css
--primary: #6366f1      /* Indigo - trustworthy, professional */
--secondary: #8b5cf6    /* Purple - premium, innovative */
--success: #10b981      /* Green - confirmed payments */
--warning: #f59e0b      /* Amber - pending status */
--error: #ef4444        /* Red - failed/expired */
--neutral: #64748b      /* Slate - text, borders */
```

**Typography**:
- **Headings**: Inter (700 weight)
- **Body**: Inter (400, 500 weight)
- **Code/Addresses**: JetBrains Mono

**Design System**: Based on Shadcn UI (TailwindCSS components)

---

## Payment Widget UI

### 1. Widget Container

**Dimensions**:
- Desktop: 400px wide × auto height
- Mobile: 100% width × auto height
- Max width: 500px

**Layout**:
```
┌─────────────────────────────────────┐
│  [Logo]         PAYMENT    [Timer]  │ ← Header
├─────────────────────────────────────┤
│                                     │
│        $100.00 USD                  │ ← Amount Display
│        ≈ 100 USDT                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│       [QR Code Image]               │ ← QR Code
│                                     │
│   ┌──────────────────────────────┐ │
│   │ 0x742d...0bEb  📋           │ │ ← Address (truncated)
│   └──────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  [Pay with MetaMask]                │ ← Wallet Buttons
│  [Pay with WalletConnect]           │
├─────────────────────────────────────┤
│  Status: Waiting for payment...     │ ← Status Bar
│  ⏱️ Expires in 12:34                │
└─────────────────────────────────────┘
```

---

### 2. Component Specifications

#### A. Header Component
```tsx
<div className="flex items-center justify-between p-4 border-b">
  <div className="flex items-center gap-2">
    {merchantLogo && <img src={merchantLogo} className="h-8 w-8" />}
    <span className="text-sm text-neutral-600">Secure Payment</span>
  </div>

  <div className="flex items-center gap-2 text-sm font-medium">
    <Clock className="h-4 w-4" />
    <span>{countdown}</span>
  </div>
</div>
```

**Behavior**:
- Timer counts down from 15:00
- When < 5:00, text turns orange (warning)
- When < 1:00, text turns red + blinks
- At 0:00, show "Payment Expired" message

---

#### B. Amount Display
```tsx
<div className="py-6 text-center bg-neutral-50">
  <div className="text-3xl font-bold text-neutral-900">
    ${amount.toFixed(2)} USD
  </div>
  <div className="text-lg text-neutral-600 mt-1">
    ≈ {cryptoAmount} {currency}
  </div>
  <div className="text-xs text-neutral-500 mt-2">
    Network: Binance Smart Chain (BEP20)
  </div>
</div>
```

**Features**:
- Fiat amount (if provided by merchant)
- Crypto amount (exact, with full decimals on hover)
- Network indicator (prevent confusion)
- Exchange rate timestamp (optional)

---

#### C. QR Code Display
```tsx
<div className="flex flex-col items-center py-6 px-4">
  <div className="bg-white p-4 rounded-lg shadow-sm border">
    <QRCode
      value={`ethereum:${paymentAddress}?amount=${amount}&token=${tokenAddress}`}
      size={200}
      level="H"
    />
  </div>

  <div className="mt-4 w-full max-w-sm">
    <div className="flex items-center gap-2 p-3 bg-neutral-100 rounded-lg">
      <input
        type="text"
        value={paymentAddress}
        readOnly
        className="flex-1 bg-transparent text-sm font-mono"
      />
      <button
        onClick={() => copyToClipboard(paymentAddress)}
        className="p-2 hover:bg-neutral-200 rounded transition"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  </div>

  <p className="text-xs text-neutral-500 mt-2 text-center">
    Scan with mobile wallet or copy address
  </p>
</div>
```

**Features**:
- High error correction (level H)
- EIP-681 format for smart QR codes (prefills amount)
- Copy button with visual feedback (checkmark animation)
- Truncated address display, full on hover
- Instructions for non-crypto users

---

#### D. Wallet Buttons
```tsx
<div className="px-4 pb-4 space-y-2">
  {/* MetaMask Button */}
  <button
    onClick={payWithMetaMask}
    className="w-full flex items-center justify-center gap-3 p-4
               bg-orange-500 hover:bg-orange-600 text-white rounded-lg
               font-medium transition shadow-sm"
  >
    <MetaMaskIcon className="h-6 w-6" />
    <span>Pay with MetaMask</span>
  </button>

  {/* WalletConnect Button */}
  <button
    onClick={payWithWalletConnect}
    className="w-full flex items-center justify-center gap-3 p-4
               bg-blue-500 hover:bg-blue-600 text-white rounded-lg
               font-medium transition shadow-sm"
  >
    <WalletConnectIcon className="h-6 w-6" />
    <span>Pay with WalletConnect</span>
  </button>

  {/* Manual Payment Toggle */}
  <button
    onClick={() => setShowManual(!showManual)}
    className="w-full text-sm text-neutral-600 hover:text-neutral-900
               py-2 transition"
  >
    {showManual ? 'Hide' : 'Show'} QR code / Manual payment
  </button>
</div>
```

**Behavior**:
- Detect if MetaMask is installed (show "Install MetaMask" if not)
- On mobile, use deep links (`metamask://`, `trust://`)
- WalletConnect opens modal with wallet selection
- Pre-fill transaction amount and recipient
- Show loading state during wallet interaction

**Transaction Pre-fill**:
```javascript
// MetaMask example
await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: userAddress,
    to: tokenContractAddress, // USDT contract
    data: erc20TransferData, // Encoded transfer(recipient, amount)
    chainId: '0x38' // BSC Mainnet
  }]
});
```

---

#### E. Status Indicator
```tsx
<div className="px-4 py-3 border-t bg-neutral-50">
  {/* Waiting State */}
  {status === 'created' && (
    <div className="flex items-center gap-2 text-neutral-600">
      <Loader className="h-4 w-4 animate-spin" />
      <span className="text-sm">Waiting for payment...</span>
    </div>
  )}

  {/* Pending State (transaction detected) */}
  {status === 'pending' && (
    <div className="flex items-center gap-2 text-warning">
      <Clock className="h-4 w-4" />
      <span className="text-sm">
        Transaction detected. Confirming... ({confirmations}/12)
      </span>
    </div>
  )}

  {/* Confirmed State */}
  {status === 'confirmed' && (
    <div className="flex items-center gap-2 text-success">
      <CheckCircle className="h-4 w-4" />
      <span className="text-sm font-medium">Payment confirmed!</span>
    </div>
  )}

  {/* Expired State */}
  {status === 'expired' && (
    <div className="flex items-center gap-2 text-error">
      <XCircle className="h-4 w-4" />
      <span className="text-sm">Payment window expired</span>
    </div>
  )}

  {/* Transaction Hash (if available) */}
  {txHash && (
    <a
      href={`https://bscscan.com/tx/${txHash}`}
      target="_blank"
      className="text-xs text-primary hover:underline mt-1 block"
    >
      View on BSCScan ↗
    </a>
  )}
</div>
```

**Real-time Updates**:
- Connect via Socket.io on mount
- Subscribe to payment ID
- Update status + confirmations live
- Show progress bar for confirmations (0-12)

---

### 3. Success Screen

**After Payment Confirmed**:
```
┌─────────────────────────────────────┐
│                                     │
│         ✅ (animated)               │
│                                     │
│      Payment Successful!            │
│                                     │
│  Transaction: 0x1a2b...3c4d         │
│  Amount: 100 USDT                   │
│  Time: Feb 17, 2026 12:34 PM        │
│                                     │
│  [ Download Receipt ]               │
│  [ Return to Store ]                │
│                                     │
│  Share:  [Twitter]  [Facebook]      │ (optional)
└─────────────────────────────────────┘
```

**Animation**:
- Confetti effect (canvas-confetti library)
- Checkmark grows from center
- Fade in transaction details

**Receipt PDF**:
- Merchant logo
- Payment details
- QR code of transaction hash
- Timestamp
- Downloadable/printable

---

### 4. Mobile Optimizations

**Mobile-Specific Features**:
1. **Deep Linking**:
   ```javascript
   // Detect mobile OS
   const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

   if (isMobile) {
     // Open Trust Wallet
     window.location.href = `trust://send?asset=c20000714_t0x55d398326f99059fF775485246999027B3197955&address=${paymentAddress}&amount=${amount}`;
   }
   ```

2. **Wallet Detection**:
   - Check if MetaMask mobile app is installed
   - Check if Trust Wallet is installed
   - Offer "Open Wallet" button (auto-detects best option)

3. **Responsive Sizing**:
   - QR code: 250px on mobile (larger for scanning)
   - Font sizes: 1.1x multiplier on mobile
   - Touch targets: Minimum 44×44px

4. **Mobile-First Layout**:
   ```css
   /* Mobile: Stack vertically */
   .payment-widget {
     flex-direction: column;
   }

   /* Desktop: Side-by-side optional */
   @media (min-width: 768px) {
     .payment-widget {
       flex-direction: row;
     }
   }
   ```

---

### 5. Theming & Customization

**Light Theme (Default)**:
```css
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #f8fafc;
  --border: #e2e8f0;
}
```

**Dark Theme**:
```css
:root[data-theme='dark'] {
  --background: #0f172a;
  --foreground: #f1f5f9;
  --card: #1e293b;
  --border: #334155;
}
```

**Merchant Customization**:
```javascript
<PeptiPayWidget
  paymentId="pay_abc123"
  theme="light" // or "dark" or "auto"
  primaryColor="#6366f1"
  merchantLogo="https://yourstore.com/logo.png"
  locale="en" // or "es", "fr", etc.
/>
```

---

## Merchant Dashboard UI

### 1. Dashboard Layout

**Sidebar Navigation**:
```
┌──────────────┐
│ [Logo]       │
├──────────────┤
│ 📊 Overview  │
│ 💳 Payments  │
│ 💰 Wallet    │
│ ⚙️  Settings │
│ 📚 Docs      │
├──────────────┤
│ 👤 Profile   │
│ 🚪 Logout    │
└──────────────┘
```

**Main Content Area**:
```
┌────────────────────────────────────────────────────┐
│  Overview                          🔔 [User Menu]   │
├────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┐        │
│  │ Today   │ Week    │ Month   │ All     │        │
│  │ Revenue │ Revenue │ Revenue │ Time    │        │
│  │ $2,450  │ $15,300 │ $67,800 │ $250K   │        │
│  └─────────┴─────────┴─────────┴─────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │      Revenue Chart (Last 30 Days)           │  │
│  │  [Line graph showing daily revenue]         │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │      Recent Transactions                     │  │
│  │  ID     │ Amount  │ Status    │ Time        │  │
│  │  pay_1  │ 100 USD │ Confirmed │ 2 min ago   │  │
│  │  pay_2  │ 50 USD  │ Pending   │ 5 min ago   │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

### 2. Overview Page

**Stats Cards**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    title="Today's Revenue"
    value="$2,450"
    change="+12.5%"
    trend="up"
    icon={<DollarSign />}
  />
  <StatCard
    title="Pending Payments"
    value="3"
    icon={<Clock />}
  />
  <StatCard
    title="Success Rate"
    value="98.5%"
    change="+2.1%"
    trend="up"
    icon={<CheckCircle />}
  />
  <StatCard
    title="Avg Transaction"
    value="$54.44"
    icon={<TrendingUp />}
  />
</div>
```

**Revenue Chart**:
- Library: Recharts
- Type: Line chart with gradient fill
- X-axis: Last 30 days
- Y-axis: Revenue in USD
- Hover: Show exact amount + date
- Toggle: USDT / USDC / BUSD breakdown

**Quick Actions**:
```tsx
<div className="flex gap-4">
  <Button onClick={createTestPayment}>
    <Plus /> Create Test Payment
  </Button>
  <Button variant="outline" onClick={viewDocs}>
    <Book /> View Documentation
  </Button>
</div>
```

---

### 3. Transactions Page

**Filters Bar**:
```tsx
<div className="flex flex-wrap gap-4 mb-6">
  <Input
    type="search"
    placeholder="Search by ID, order, or hash..."
    className="max-w-sm"
  />

  <Select value={status} onValueChange={setStatus}>
    <option value="all">All Statuses</option>
    <option value="confirmed">Confirmed</option>
    <option value="pending">Pending</option>
    <option value="expired">Expired</option>
  </Select>

  <Select value={currency} onValueChange={setCurrency}>
    <option value="all">All Currencies</option>
    <option value="USDT">USDT</option>
    <option value="USDC">USDC</option>
    <option value="BUSD">BUSD</option>
  </Select>

  <DateRangePicker
    from={startDate}
    to={endDate}
    onChange={({ from, to }) => {
      setStartDate(from);
      setEndDate(to);
    }}
  />

  <Button variant="outline" onClick={exportCSV}>
    <Download /> Export CSV
  </Button>
</div>
```

**Data Table**:
```tsx
<DataTable
  columns={[
    { header: 'Payment ID', accessor: 'id', sortable: true },
    { header: 'Order ID', accessor: 'orderId' },
    { header: 'Amount', accessor: 'amount', sortable: true },
    { header: 'Currency', accessor: 'currency' },
    { header: 'Status', accessor: 'status', render: StatusBadge },
    { header: 'Created', accessor: 'createdAt', sortable: true },
    { header: 'Actions', accessor: 'actions', render: ActionsMenu }
  ]}
  data={transactions}
  pagination={{ page, perPage: 50, total }}
  onPageChange={setPage}
/>
```

**Status Badges**:
```tsx
// Confirmed: Green badge
<Badge variant="success">Confirmed</Badge>

// Pending: Yellow badge with pulse animation
<Badge variant="warning" className="animate-pulse">Pending</Badge>

// Expired: Red badge
<Badge variant="destructive">Expired</Badge>
```

**Actions Menu**:
```tsx
<DropdownMenu>
  <DropdownMenuItem onClick={viewDetails}>
    <Eye /> View Details
  </DropdownMenuItem>
  <DropdownMenuItem onClick={downloadReceipt}>
    <Download /> Download Receipt
  </DropdownMenuItem>
  <DropdownMenuItem onClick={refund}>
    <RefreshCw /> Refund
  </DropdownMenuItem>
  <DropdownMenuItem onClick={copyId}>
    <Copy /> Copy ID
  </DropdownMenuItem>
</DropdownMenu>
```

---

### 4. Wallet Page

**Balance Display**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <BalanceCard
    currency="USDT"
    balance="2,450.00"
    usdValue="$2,450.00"
  />
  <BalanceCard
    currency="USDC"
    balance="1,200.50"
    usdValue="$1,200.50"
  />
  <BalanceCard
    currency="BUSD"
    balance="0.00"
    usdValue="$0.00"
  />
</div>
```

**Withdrawal Form**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Withdraw Funds</CardTitle>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleWithdraw}>
      <div className="space-y-4">
        <div>
          <Label>Currency</Label>
          <Select value={currency} onChange={setCurrency}>
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </Select>
        </div>

        <div>
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Available: {availableBalance} {currency}
          </p>
        </div>

        <div>
          <Label>Destination Address</Label>
          <Input
            type="text"
            placeholder="0x..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
        </div>

        <div>
          <Label>2FA Code</Label>
          <Input
            type="text"
            placeholder="123456"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full">
          Withdraw {amount} {currency}
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

**Transaction History**:
- Table showing withdrawals + deposits
- Filter by type (withdrawal, deposit, fee collection)
- Export to CSV

---

### 5. Settings Page

**Tabs**:
- API Keys
- Webhooks
- Profile
- Security

**API Keys Tab**:
```tsx
<div className="space-y-4">
  {apiKeys.map(key => (
    <Card key={key.id}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="font-mono text-sm">
            {key.key.substring(0, 20)}...
          </div>
          <div className="text-xs text-neutral-500">
            Created: {key.createdAt}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => copyKey(key.key)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => deleteKey(key.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}

  <Button onClick={generateKey}>
    <Plus /> Generate New API Key
  </Button>
</div>
```

**Webhooks Tab**:
```tsx
<Card>
  <CardContent className="space-y-4 p-6">
    <div>
      <Label>Webhook URL</Label>
      <Input
        type="url"
        placeholder="https://yoursite.com/webhooks/pptpay"
        value={webhookUrl}
        onChange={(e) => setWebhookUrl(e.target.value)}
      />
    </div>

    <div>
      <Label>Webhook Secret</Label>
      <div className="flex gap-2">
        <Input
          type="password"
          value={webhookSecret}
          readOnly
        />
        <Button variant="outline" onClick={regenerateSecret}>
          Regenerate
        </Button>
      </div>
    </div>

    <div>
      <Label>Events</Label>
      <div className="space-y-2">
        <Checkbox checked={events.includes('payment.confirmed')}>
          payment.confirmed
        </Checkbox>
        <Checkbox checked={events.includes('payment.failed')}>
          payment.failed
        </Checkbox>
      </div>
    </div>

    <div className="flex gap-2">
      <Button onClick={saveWebhook}>Save Configuration</Button>
      <Button variant="outline" onClick={testWebhook}>
        Send Test Event
      </Button>
    </div>
  </CardContent>
</Card>

{/* Webhook Logs */}
<Card className="mt-4">
  <CardHeader>
    <CardTitle>Recent Deliveries</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {webhookLogs.map(log => (
          <TableRow key={log.id}>
            <TableCell>{log.event}</TableCell>
            <TableCell>
              {log.responseStatus === 200 ? (
                <Badge variant="success">Success</Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
            </TableCell>
            <TableCell>{log.deliveredAt}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => viewLog(log)}>
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

### 6. Accessibility Features

**WCAG 2.1 AA Compliance**:
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Focus indicators (visible outlines)
- ✅ ARIA labels for screen readers
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Alt text for all images
- ✅ Semantic HTML (proper heading hierarchy)

**Example**:
```tsx
<button
  aria-label="Copy payment address to clipboard"
  aria-describedby="copy-tooltip"
  onClick={copyAddress}
>
  <Copy aria-hidden="true" />
</button>
```

---

### 7. Animation & Micro-interactions

**Subtle Animations**:
```css
/* Hover effects */
.button {
  transition: all 0.15s ease-in-out;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Status badge pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.badge-pending {
  animation: pulse 2s ease-in-out infinite;
}

/* Success checkmark animation */
@keyframes checkmark {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

.success-icon {
  animation: checkmark 0.5s ease-out;
}
```

**Loading States**:
```tsx
// Skeleton loader for table rows
{isLoading && (
  <TableRow>
    <TableCell colSpan={7}>
      <Skeleton className="h-12 w-full" />
    </TableCell>
  </TableRow>
)}

// Button loading state
<Button disabled={isLoading}>
  {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Processing...' : 'Withdraw'}
</Button>
```

---

## Responsive Breakpoints

```css
/* Mobile: 0-640px */
@media (max-width: 640px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .table { font-size: 0.875rem; }
}

/* Tablet: 641-1024px */
@media (min-width: 641px) and (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 1025px+ */
@media (min-width: 1025px) {
  .dashboard-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## Performance Optimization

1. **Lazy Loading**:
   ```tsx
   const Chart = lazy(() => import('./Chart'));
   const TransactionsTable = lazy(() => import('./TransactionsTable'));
   ```

2. **Image Optimization**:
   - QR codes: Generate on-demand, cache in Redis
   - Logos: WebP format with PNG fallback
   - Icons: SVG (inline or sprite sheet)

3. **Code Splitting**:
   - Dashboard: Separate bundle (~200KB)
   - Widget: Separate bundle (~150KB)
   - Total: < 500KB initial load

4. **Virtualization** (for long tables):
   ```tsx
   import { useVirtualizer } from '@tanstack/react-virtual';
   // Render only visible rows (performance boost for 1000+ rows)
   ```

---

## Design Deliverables Checklist

✅ Payment widget mockups (light + dark theme)
✅ Dashboard mockups (all pages)
✅ Mobile responsive designs
✅ Component specifications
✅ Color palette and typography
✅ Animation specifications
✅ Accessibility guidelines
✅ Performance targets

**Next**: Read [06-SECURITY-GUIDE.md](06-SECURITY-GUIDE.md) for security implementation details.
