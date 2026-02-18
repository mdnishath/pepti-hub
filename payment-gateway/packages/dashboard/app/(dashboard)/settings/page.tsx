'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileData = await authAPI.getProfile();
        setProfile(profileData);
        const storedApiKey = localStorage.getItem('apiKey') || '';
        setApiKey(storedApiKey);
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

  const handleRegenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? This will invalidate the current key.')) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await authAPI.regenerateAPIKey();
      setApiKey(response.apiKey);
      localStorage.setItem('apiKey', response.apiKey);
      alert('API key regenerated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to regenerate API key');
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle API key display
  const hasApiKey = apiKey && apiKey !== '' && apiKey !== 'undefined' && apiKey !== 'null' && apiKey.length >= 24;
  const maskedApiKey = hasApiKey
    ? `${apiKey.slice(0, 12)}${'*'.repeat(40)}${apiKey.slice(-12)}`
    : '🔒 API key hidden for security. Click "Regenerate" to generate a new key.';

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
              <Link href="/settings" className="text-primary-600 font-medium border-b-2 border-primary-600 pb-1">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-600 mt-1">Manage your API keys and account information</p>
        </div>

        {/* API Key Section */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">API Key</h3>
          <p className="text-sm text-gray-600 mb-4">
            Use this API key to authenticate requests to the PeptiPay API. Keep it secure and never share it publicly.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Your API Key</label>
              {hasApiKey && (
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
                {showApiKey && hasApiKey ? apiKey : maskedApiKey}
              </code>
              {hasApiKey && (
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="btn btn-secondary"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleRegenerateApiKey}
            disabled={regenerating}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ Regenerating your API key will invalidate the current key. Update your integration immediately after regeneration.
          </p>
        </div>

        {/* Account Information */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Business Name</label>
              <p className="mt-1 text-gray-900">{profile?.businessName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <p className="mt-1 text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Settlement Wallet Address</label>
              <div className="mt-1 flex items-center space-x-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-mono">
                  {profile?.walletAddress}
                </code>
                <button
                  onClick={() => copyToClipboard(profile?.walletAddress)}
                  className="btn btn-secondary"
                  title="Copy to clipboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Confirmed payments will be settled to this BSC wallet address
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-gray-900">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Integration Guide</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">1. Create a Payment</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`curl -X POST http://localhost:3000/api/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey.slice(0, 20)}..." \\
  -d '{
    "orderId": "order_123",
    "amount": "100",
    "currency": "USDT",
    "callbackUrl": "https://yoursite.com/webhook",
    "returnUrl": "https://yoursite.com/success"
  }'`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">2. Response</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "id": "payment_abc123",
  "orderId": "order_123",
  "amount": "100",
  "currency": "USDT",
  "paymentAddress": "0x...",
  "status": "CREATED",
  "expiresAt": "2024-01-01T12:00:00Z",
  "qrCode": "data:image/png;base64,..."
}`}
              </pre>
            </div>

            <div>
              <p className="text-sm text-gray-600">
                For complete API documentation, visit the{' '}
                <a href="/docs" className="text-primary-600 hover:underline">
                  API docs
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
