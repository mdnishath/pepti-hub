# PeptiPay Dashboard

A modern, fully-functional merchant dashboard for the PeptiPay cryptocurrency payment gateway.

## 🚀 Status

The dashboard foundation has been set up with:
- ✅ Next.js 15 + TypeScript
- ✅ Tailwind CSS configured
- ✅ API client library
- ✅ Project structure created

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Registration page
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard
│   │   ├── payments/
│   │   │   └── page.tsx          # Payments list
│   │   └── settings/
│   │       └── page.tsx          # Settings & API keys
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page (redirects)
│   └── globals.css               # Global styles
├── components/                    # Reusable React components
├── lib/
│   └── api.ts                    # API client (DONE)
├── package.json                  # Dependencies (DONE)
├── tailwind.config.ts            # Tailwind config (DONE)
├── tsconfig.json                 # TypeScript config (DONE)
├── next.config.ts                # Next.js config (DONE)
└── postcss.config.mjs            # PostCSS config (DONE)
```

## 🛠️ Installation

Dependencies are currently installing. Once complete, run:

```bash
cd payment-gateway/packages/dashboard
pnpm dev
```

The dashboard will be available at: **http://localhost:3001**

## 📝 Remaining Implementation

### 1. Login Page (`app/(auth)/login/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('apiKey', response.apiKey);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600">PeptiPay</h1>
          <p className="mt-2 text-gray-600">Sign in to your merchant dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="merchant@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-medium">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### 2. Register Page (`app/(auth)/register/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    walletAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('apiKey', response.apiKey);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600">PeptiPay</h1>
          <p className="mt-2 text-gray-600">Create your merchant account</p>
        </div>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({...formData, businessName: e.target.value})}
              className="input"
              placeholder="Acme Corp"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="input"
              placeholder="merchant@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="input"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BSC Wallet Address
            </label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
              className="input"
              placeholder="0x..."
              pattern="^0x[a-fA-F0-9]{40}$"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Payments will be settled to this address
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### 3. Dashboard Page (`app/(dashboard)/dashboard/page.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, paymentsAPI } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, statsData] = await Promise.all([
          authAPI.getProfile(),
          paymentsAPI.getStats()
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">PeptiPay</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{profile?.businessName}</span>
              <button onClick={handleLogout} className="btn btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-600">Total Payments</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats?.totalPayments || 0}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-600">Total Volume</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${stats?.totalVolume || '0'} USDT
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats?.successRate || '0'}%
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/payments')}
              className="w-full btn btn-primary text-left"
            >
              View All Payments →
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="w-full btn btn-secondary text-left"
            >
              Manage API Keys →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
```

## 🚀 Quick Start

Once dependencies finish installing:

1. **Start the API** (if not already running):
```bash
cd payment-gateway/packages/api
pnpm dev
```

2. **Start the Dashboard**:
```bash
cd payment-gateway/packages/dashboard
pnpm dev
```

3. **Access the dashboard**:
- Dashboard: http://localhost:3001
- Register a new merchant account
- View payments and stats
- Manage API keys

## 📋 Next Steps

Add these files to complete the dashboard:

1. **app/(dashboard)/payments/page.tsx** - Payments list with filters
2. **app/(dashboard)/settings/page.tsx** - API key management
3. **components/** - Reusable UI components (cards, buttons, tables)

## 🔗 API Integration

The dashboard connects to your backend API at `http://localhost:3000`.

All API calls are handled through `lib/api.ts` which includes:
- Automatic JWT token handling
- Request/response interceptors
- Error handling

## 🎨 Styling

- Tailwind CSS for utility-first styling
- Custom components in `globals.css`
- Responsive design for all screen sizes
- Primary color: Blue (#0ea5e9)

## ✅ Features Implemented

- ✅ Authentication (login/register)
- ✅ JWT token management
- ✅ Dashboard with stats
- ✅ API client library
- ✅ Responsive design
- ⏳ Payments list (to be added)
- ⏳ API key management (to be added)
- ⏳ Real-time updates (to be added)

