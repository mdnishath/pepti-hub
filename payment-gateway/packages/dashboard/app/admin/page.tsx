'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_PASSWORD = 'admin_ppt_9a7f2d8e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f';

type TabType = 'dashboard' | 'gas' | 'recovery' | 'wallet';

export default function AdminPanel() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Dashboard data
  const [stats, setStats] = useState<any>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  // Gas funding data
  const [gasStatus, setGasStatus] = useState<any>(null);
  const [gasLoading, setGasLoading] = useState(false);

  // Recovery data
  const [recoverySummary, setRecoverySummary] = useState<any>(null);
  const [unsettledPayments, setUnsettledPayments] = useState<any[]>([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      loadDashboardData();
    } else {
      alert('Invalid admin password');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('adminAuth') === 'true') {
      setAuthenticated(true);
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      switch (activeTab) {
        case 'dashboard':
          loadDashboardData();
          break;
        case 'gas':
          loadGasData();
          break;
        case 'recovery':
          loadRecoveryData();
          break;
      }
    }
  }, [activeTab, authenticated]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/admin/dashboard', {
          headers: { 'Authorization': `Bearer ${ADMIN_PASSWORD}` }
        }),
        fetch('http://localhost:3000/api/v1/admin/payments?status=CONFIRMED', {
          headers: { 'Authorization': `Bearer ${ADMIN_PASSWORD}` }
        })
      ]);

      const statsData = await statsRes.json();
      const paymentsData = await paymentsRes.json();

      setStats(statsData);
      setSettlements(paymentsData.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGasData = async () => {
    setGasLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/gas/status', {
        headers: { 'Authorization': `Bearer ${ADMIN_PASSWORD}` }
      });
      const data = await res.json();
      setGasStatus(data);
    } catch (error) {
      console.error('Failed to load gas data:', error);
    } finally {
      setGasLoading(false);
    }
  };

  const loadRecoveryData = async () => {
    setRecoveryLoading(true);
    try {
      const [summaryRes, paymentsRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/admin/recovery/summary', {
          headers: { 'Authorization': `Bearer ${ADMIN_PASSWORD}` }
        }),
        fetch('http://localhost:3000/api/v1/admin/recovery/payments', {
          headers: { 'Authorization': `Bearer ${ADMIN_PASSWORD}` }
        })
      ]);

      const summaryData = await summaryRes.json();
      const paymentsData = await paymentsRes.json();

      setRecoverySummary(summaryData);
      setUnsettledPayments(paymentsData.data || []);
    } catch (error) {
      console.error('Failed to load recovery data:', error);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleProcessSettlements = async () => {
    if (!confirm('Process all pending settlements?')) return;

    setProcessing(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/settlements/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_PASSWORD}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      alert(`Processed: ${data.result.successful} successful, ${data.result.failed} failed`);
      loadDashboardData();
    } catch (error: any) {
      alert('Failed to process settlements: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFundGas = async (paymentId: string) => {
    if (!confirm('Fund this payment address with gas (0.0015 BNB)?')) return;

    try {
      const res = await fetch(`http://localhost:3000/api/v1/admin/gas/fund/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_PASSWORD}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Gas funded successfully!\nTx: ${data.txHash}`);
        loadDashboardData();
      } else {
        alert(`Failed to fund gas: ${data.message}`);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleRecoverSingle = async (paymentId: string) => {
    if (!confirm('Recover USDT and BNB from this address to platform wallet?')) return;

    try {
      const res = await fetch(`http://localhost:3000/api/v1/admin/recovery/recover/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_PASSWORD}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Recovery successful!\nUSDT: ${data.usdtRecovered}\nBNB: ${data.bnbRecovered}`);
        loadRecoveryData();
      } else {
        alert(`Failed to recover: ${data.message}`);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleRecoverAll = async () => {
    if (!confirm('Recover ALL unsettled funds to platform wallet? This will process all addresses.')) return;

    setRecoveryLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/recovery/recover-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_PASSWORD}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      alert(`Bulk recovery completed!\nProcessed: ${data.processed}\nSuccessful: ${data.successful}\nFailed: ${data.failed}\nTotal USDT: ${data.totalUSDT}\nTotal BNB: ${data.totalBNB}`);
      loadRecoveryData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setAuthenticated(false);
    setPassword('');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="card max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">PeptiPay Admin Panel</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter admin password"
              />
            </div>
            <button onClick={handleLogin} className="btn btn-primary w-full">
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">🔐 PeptiPay Admin</h1>
            <button onClick={handleLogout} className="btn bg-red-600 text-white hover:bg-red-700 text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('gas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gas'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⛽ Gas Management
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recovery'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔄 Funds Recovery
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wallet'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💰 Platform Wallet
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Total Merchants</h3>
                    <p className="text-3xl font-bold mt-2">{stats?.merchants?.total || 0}</p>
                    <p className="text-xs opacity-75 mt-1">{stats?.merchants?.active || 0} active</p>
                  </div>
                  <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Total Volume</h3>
                    <p className="text-2xl font-bold mt-2">{stats?.volume?.total || '0'} USDT</p>
                    <p className="text-xs opacity-75 mt-1">{stats?.payments?.total || 0} payments</p>
                  </div>
                  <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Platform Revenue</h3>
                    <p className="text-2xl font-bold mt-2">{stats?.volume?.platformFees || '0'} USDT</p>
                    <p className="text-xs opacity-75 mt-1">2.5% fee + gas</p>
                  </div>
                  <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Pending Settlements</h3>
                    <p className="text-3xl font-bold mt-2">{stats?.pending?.settlements || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Need processing</p>
                  </div>
                </div>

                {/* Payment Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-600">Created</h3>
                    <p className="text-2xl font-bold mt-2">{stats?.payments?.byStatus?.CREATED || 0}</p>
                  </div>
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-600">Confirmed</h3>
                    <p className="text-2xl font-bold mt-2 text-yellow-600">{stats?.payments?.byStatus?.CONFIRMED || 0}</p>
                  </div>
                  <div className="card">
                    <h3 className="text-sm font-medium text-gray-600">Settled</h3>
                    <p className="text-2xl font-bold mt-2 text-green-600">{stats?.payments?.byStatus?.SETTLED || 0}</p>
                  </div>
                </div>

                {/* Settlement Control */}
                <div className="card mb-8 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900">Settlement Management</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {settlements.length} payment(s) pending settlement
                      </p>
                    </div>
                    <button
                      onClick={handleProcessSettlements}
                      disabled={processing || settlements.length === 0}
                      className="btn bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Process All Settlements'}
                    </button>
                  </div>
                </div>

                {/* Pending Settlements Table */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Pending Settlements</h3>
                  {settlements.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pending settlements ✅</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Address</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {settlements.map((settlement: any) => (
                            <tr key={settlement.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono">{settlement.orderId}</td>
                              <td className="px-4 py-3 text-sm font-semibold">{settlement.amount} USDT</td>
                              <td className="px-4 py-3 text-sm">{settlement.merchant?.businessName}</td>
                              <td className="px-4 py-3 text-sm font-mono text-xs">
                                {settlement.paymentAddress?.slice(0, 10)}...
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleFundGas(settlement.id)}
                                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Fund Gas
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* System Status */}
                <div className="card mt-8">
                  <h3 className="text-lg font-semibold mb-4">System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Transaction Monitor</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        {stats?.services?.transactionMonitor?.isMonitoring ? '✅ Running' : '❌ Stopped'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Webhook Worker</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        {stats?.services?.webhookWorker?.isRunning ? '✅ Running' : '❌ Stopped'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Active Listeners</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {stats?.services?.transactionMonitor?.activeListeners || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Gas Management Tab */}
        {activeTab === 'gas' && (
          <>
            {gasLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                {/* Gas Wallet Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Gas Wallet Balance</h3>
                    <p className="text-3xl font-bold mt-2">{gasStatus?.balance || '0'} BNB</p>
                    <p className="text-xs opacity-75 mt-1">≈ ${gasStatus?.balanceUSD || '0'} USD</p>
                  </div>
                  <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Estimated Settlements</h3>
                    <p className="text-3xl font-bold mt-2">{gasStatus?.estimatedSettlements || 0}</p>
                    <p className="text-xs opacity-75 mt-1">With current gas balance</p>
                  </div>
                  <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Wallet Address</h3>
                    <p className="text-xs font-mono mt-2 break-all">{gasStatus?.address}</p>
                    <a
                      href={`https://bscscan.com/address/${gasStatus?.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline mt-2 inline-block opacity-90 hover:opacity-100"
                    >
                      View on BscScan →
                    </a>
                  </div>
                </div>

                {/* Gas Info */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Gas Management Info</h3>
                  <div className="space-y-4 text-sm">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Automatic Gas Funding</h4>
                      <p className="text-blue-800">
                        When a payment is confirmed, the system automatically checks if the payment address needs gas for settlement.
                        If balance is below 0.0008 BNB, it automatically sends 0.0015 BNB for gas.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Gas Recovery</h4>
                      <p className="text-green-800">
                        After settlement, leftover BNB (dust) is automatically recovered back to the gas wallet.
                        Only amounts above 0.0001 BNB are recovered to save on transaction fees.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">Gas Fee Economics</h4>
                      <p className="text-purple-800">
                        Gas cost (~$0.60) is deducted from merchant's net amount. Platform receives 2.5% fee + gas reimbursement.
                        This ensures zero gas burden on customers and platform.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Funds Recovery Tab */}
        {activeTab === 'recovery' && (
          <>
            {recoveryLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                {/* Recovery Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Unsettled Payments</h3>
                    <p className="text-3xl font-bold mt-2">{recoverySummary?.count || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Older than 24 hours</p>
                  </div>
                  <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Recoverable USDT</h3>
                    <p className="text-3xl font-bold mt-2">{recoverySummary?.totalUSDT || '0'}</p>
                    <p className="text-xs opacity-75 mt-1">Ready to recover</p>
                  </div>
                  <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <h3 className="text-sm font-medium opacity-90">Recoverable BNB</h3>
                    <p className="text-3xl font-bold mt-2">{recoverySummary?.totalBNB || '0'}</p>
                    <p className="text-xs opacity-75 mt-1">≈ ${recoverySummary?.estimatedValueUSD || '0'} USD</p>
                  </div>
                </div>

                {/* Recovery Control */}
                <div className="card mb-8 bg-orange-50 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900">Bulk Recovery</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Recover all unsettled funds to platform wallet for development
                      </p>
                    </div>
                    <button
                      onClick={handleRecoverAll}
                      disabled={recoveryLoading || !unsettledPayments.length}
                      className="btn bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Recover All Funds
                    </button>
                  </div>
                </div>

                {/* Unsettled Payments Table */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Unsettled Payments</h3>
                  {unsettledPayments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No unsettled payments to recover ✅</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Address</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">USDT Balance</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">BNB Balance</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {unsettledPayments.map((payment: any) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono text-xs">
                                {payment.paymentAddress?.slice(0, 10)}...{payment.paymentAddress?.slice(-8)}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold">{payment.usdtBalance || '0'}</td>
                              <td className="px-4 py-3 text-sm">{payment.bnbBalance || '0'}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{payment.age}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleRecoverSingle(payment.id)}
                                  className="text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                                >
                                  Recover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recovery Info */}
                <div className="card mt-8">
                  <h3 className="text-lg font-semibold mb-4">Recovery Information</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>• Unsettled payments older than 24 hours are eligible for recovery</p>
                    <p>• Recovered funds go to platform wallet (0xAB5466e8F022D69Fefd36bab3fF226908BeD1443)</p>
                    <p>• Both USDT and BNB balances are recovered in one transaction per address</p>
                    <p>• This helps recover funds from abandoned/expired payments for development</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Platform Wallet Tab */}
        {activeTab === 'wallet' && (
          <>
            <div className="card mb-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <h3 className="text-lg font-semibold mb-4">Platform Wallet (Your Revenue)</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm opacity-90 mb-2">Wallet Address</p>
                  <code className="block bg-white/20 p-3 rounded text-sm font-mono break-all">
                    0xAB5466e8F022D69Fefd36bab3fF226908BeD1443
                  </code>
                </div>
                <div className="flex gap-4">
                  <a
                    href="https://bscscan.com/address/0xAB5466e8F022D69Fefd36bab3fF226908BeD1443"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:opacity-80"
                  >
                    View on BscScan →
                  </a>
                  <a
                    href="https://bscscan.com/address/0xAB5466e8F022D69Fefd36bab3fF226908BeD1443#tokentxns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:opacity-80"
                  >
                    View USDT Transactions →
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Current Balance</h3>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 mb-2">Estimated Platform Revenue</p>
                  <p className="text-3xl font-bold text-green-900">{stats?.volume?.platformFees || '0'} USDT</p>
                  <p className="text-xs text-green-700 mt-2">Based on settled payments (2.5% fee + gas reimbursement)</p>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Platform Fee (2.5%)</span>
                    <span className="text-sm font-bold">Main revenue stream</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Gas Reimbursement</span>
                    <span className="text-sm font-bold">~$0.60 per settlement</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Recovered Funds</span>
                    <span className="text-sm font-bold">From unsettled payments</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Withdrawal Methods</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Method 1: MetaMask Import</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Open MetaMask and click "Import Account"</li>
                    <li>Select "Private Key"</li>
                    <li>Run: <code className="bg-blue-100 px-2 py-1 rounded">cd payment-gateway/packages/api && node -r ts-node/register src/get-platform-wallet-key.ts</code></li>
                    <li>Paste the private key and import</li>
                    <li>Switch to BSC Mainnet</li>
                    <li>Send USDT/BNB to your personal wallet or exchange</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Method 2: Direct Withdrawal Script</h4>
                  <p className="text-sm text-green-800 mb-2">
                    Create a script to withdraw to your personal wallet:
                  </p>
                  <pre className="bg-green-100 p-3 rounded text-xs overflow-x-auto">
{`// withdraw-platform-funds.ts
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
const platformWallet = ethers.HDNodeWallet.fromPhrase(
  process.env.MASTER_MNEMONIC!
).deriveChild(0).connect(provider);

const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const YOUR_WALLET = 'YOUR_PERSONAL_WALLET_ADDRESS';

// Transfer USDT
const usdtContract = new ethers.Contract(
  USDT_ADDRESS,
  ['function transfer(address,uint256) returns (bool)'],
  platformWallet
);

const balance = await usdtContract.balanceOf(platformWallet.address);
await usdtContract.transfer(YOUR_WALLET, balance);`}
                  </pre>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Security Notes</h4>
                  <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                    <li>Never share your seed phrase or private key</li>
                    <li>Always verify the recipient address before sending</li>
                    <li>Start with a small test transaction first</li>
                    <li>Keep your .env file secure and backed up</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
