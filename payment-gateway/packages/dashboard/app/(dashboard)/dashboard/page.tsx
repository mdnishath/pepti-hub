'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, paymentsAPI } from '@/lib/api';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Key,
  ChevronRight,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  iconColor: string;
}

function StatCard({ title, value, subtitle, change, changeType, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 group-hover:text-brand-300 transition-colors">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-100 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {change && changeType && (
            <div className="flex items-center mt-2">
              {changeType === 'increase' ? (
                <ArrowUpRight className="w-4 h-4 text-brand-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm font-medium ml-1 ${
                  changeType === 'increase' ? 'text-brand-400' : 'text-red-400'
                }`}
              >
                {change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Welcome back, {profile?.businessName}!
        </h1>
        <p className="text-gray-400 mt-2">Here's what's happening with your payments today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payments"
          value={stats?.totalPayments?.toString() || '0'}
          change="+12.5%"
          changeType="increase"
          icon={CreditCard}
          iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Revenue"
          value={`${stats?.totalRevenue || '0'}`}
          subtitle="USDT"
          change="+8.2%"
          changeType="increase"
          icon={DollarSign}
          iconColor="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.successRate || '0'}%`}
          change="+3.1%"
          changeType="increase"
          icon={TrendingUp}
          iconColor="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Avg. Amount"
          value={`${stats?.averageAmount || '0'}`}
          subtitle="USDT"
          change="+5.4%"
          changeType="increase"
          icon={Activity}
          iconColor="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Quick Actions & Account Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/payments"
              className="flex items-center justify-between p-4 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-100">View All Payments</p>
                  <p className="text-xs text-gray-400">Manage your transactions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-400 transition-colors" />
            </Link>

            <Link
              href="/settings"
              className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-100">Manage API Keys</p>
                  <p className="text-xs text-gray-400">Update integration settings</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-200 transition-colors" />
            </Link>
          </div>

          {/* Integration Guide */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-start space-x-2 mb-3">
              <div className="w-6 h-6 bg-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-200 mb-1">Integration Guide</p>
                <p className="text-xs text-gray-400 mb-3">
                  Use your API key to integrate payments:
                </p>
                <code className="block bg-dark-bg-lighter border border-white/10 p-3 rounded-lg text-xs font-mono text-brand-300 overflow-x-auto">
                  POST /api/v1/payments
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Account Information</h2>
          <div className="space-y-5">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Business Name
              </label>
              <p className="text-gray-100 mt-1.5 font-medium">{profile?.businessName}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Email</label>
              <p className="text-gray-100 mt-1.5 font-medium">{profile?.email}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Settlement Wallet
                </label>
                <Wallet className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-gray-100 font-mono text-xs break-all">{profile?.walletAddress}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Member Since
              </label>
              <p className="text-gray-100 mt-1.5 font-medium">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Network Info */}
      <div className="card">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-brand-500/20">
            <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-100 mb-1">BSC Mainnet</h3>
            <p className="text-sm text-gray-400 mb-3">
              Your payment gateway is running on Binance Smart Chain mainnet with USDT settlements.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                • Live
              </span>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
                USDT
              </span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-full border border-purple-500/20">
                Auto Settlement
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
