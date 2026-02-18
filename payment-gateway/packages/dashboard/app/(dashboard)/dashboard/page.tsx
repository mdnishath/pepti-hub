'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                Dashboard
              </Link>
              <Link href="/payments" className="text-gray-700 hover:text-primary-600 font-medium">
                Payments
              </Link>
              <Link href="/settings" className="text-gray-700 hover:text-primary-600 font-medium">
                Settings
              </Link>
              <span className="text-sm text-gray-600 border-l pl-4 ml-4">{profile?.businessName}</span>
              <button onClick={handleLogout} className="btn btn-secondary text-sm">
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.businessName}!</h2>
          <p className="text-gray-600 mt-1">Here's what's happening with your payments today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Payments</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalPayments || 0}
                </p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.totalRevenue || '0'} <span className="text-lg">USDT</span>
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.successRate || '0'}%
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Avg. Amount</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats?.averageAmount || '0'} <span className="text-lg">USDT</span>
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/payments" className="block w-full btn btn-primary text-left">
                <div className="flex items-center justify-between">
                  <span>View All Payments</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              <Link href="/settings" className="block w-full btn btn-secondary text-left">
                <div className="flex items-center justify-between">
                  <span>Manage API Keys</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              <div className="pt-3 border-t">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Integration Guide</p>
                  <p className="mb-2">Use your API key to integrate payments:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
                    POST /api/v1/payments
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Business Name</label>
                <p className="text-gray-900 mt-1">{profile?.businessName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Email</label>
                <p className="text-gray-900 mt-1">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Settlement Wallet</label>
                <p className="text-gray-900 mt-1 font-mono text-sm">{profile?.walletAddress}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Member Since</label>
                <p className="text-gray-900 mt-1">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
