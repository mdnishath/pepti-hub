'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Key, Copy, Check, RefreshCw, Eye, EyeOff, Wallet, Mail, Building } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Handle API key display
  const hasApiKey = apiKey && apiKey !== '' && apiKey !== 'undefined' && apiKey !== 'null' && apiKey.length >= 24;
  const maskedApiKey = hasApiKey
    ? `${apiKey.slice(0, 12)}${'*'.repeat(40)}${apiKey.slice(-12)}`
    : '🔒 API key hidden for security. Click "Regenerate" to generate a new key.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account settings and API configuration</p>
      </div>

      {/* Account Information */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
            <Building className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Account Information</h2>
            <p className="text-sm text-gray-400">Your business account details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-4 h-4 text-gray-400" />
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Business Name
              </label>
            </div>
            <p className="text-gray-100 font-medium">{profile?.businessName}</p>
          </div>

          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Email Address
              </label>
            </div>
            <p className="text-gray-100 font-medium">{profile?.email}</p>
          </div>

          <div className="p-5 bg-white/5 rounded-xl border border-white/10 md:col-span-2">
            <div className="flex items-center space-x-2 mb-2">
              <Wallet className="w-4 h-4 text-brand-400" />
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Settlement Wallet Address
              </label>
            </div>
            <p className="text-gray-100 font-mono text-sm break-all">{profile?.walletAddress}</p>
            <p className="text-xs text-gray-500 mt-2">
              This wallet will receive all settled payments from your customers.
            </p>
          </div>
        </div>
      </div>

      {/* API Key Management */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Key className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">API Key Management</h2>
            <p className="text-sm text-gray-400">Use this key to integrate payments into your application</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* API Key Display */}
          <div className="p-5 bg-dark-bg-lighter rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400 font-medium">Your API Key</label>
              {hasApiKey && (
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center space-x-1"
                >
                  {showApiKey ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-dark-bg border border-white/5 px-4 py-3 rounded-lg text-sm font-mono text-gray-300 overflow-x-auto">
                {showApiKey && hasApiKey ? apiKey : maskedApiKey}
              </code>
              {hasApiKey && (
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center space-x-2"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-300" />
                      <span className="text-sm text-gray-300">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="flex items-center justify-between p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-300 mb-1">Regenerate API Key</h3>
              <p className="text-xs text-yellow-400/80">
                This action will invalidate your current API key. Update all integrations with the new key.
              </p>
            </div>
            <button
              onClick={handleRegenerateApiKey}
              disabled={regenerating}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ml-4"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Quick Integration Guide</h2>
            <p className="text-sm text-gray-400">Get started with payment integration</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">1. Create a Payment</h3>
            <pre className="bg-dark-bg-lighter border border-white/10 p-4 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto">
{`curl -X POST http://localhost:3000/api/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "orderId": "order_123",
    "amount": "100.00",
    "currency": "USDT",
    "returnUrl": "https://yoursite.com/success",
    "callbackUrl": "https://yoursite.com/webhook"
  }'`}
            </pre>
          </div>

          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">2. Redirect Customer to Payment URL</h3>
            <p className="text-sm text-gray-400 mb-2">
              The API will return a <code className="text-brand-400">paymentUrl</code>. Redirect your customer to this
              URL to complete the payment.
            </p>
          </div>

          <div className="p-5 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">3. Handle Webhook Notifications</h3>
            <p className="text-sm text-gray-400">
              You'll receive webhook notifications at your <code className="text-brand-400">callbackUrl</code> when
              payment status changes (PENDING, CONFIRMED, SETTLED).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
