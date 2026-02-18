'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, paymentsAPI } from '@/lib/api';

export default function PaymentsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, paymentsData] = await Promise.all([
          authAPI.getProfile(),
          paymentsAPI.getPayments(page, 10)
        ]);
        setProfile(profileData);

        // Handle different response formats and ensure array
        let paymentsArray = [];
        if (Array.isArray(paymentsData)) {
          paymentsArray = paymentsData;
        } else if (paymentsData?.data && Array.isArray(paymentsData.data)) {
          paymentsArray = paymentsData.data;
        } else if (paymentsData?.payments && Array.isArray(paymentsData.payments)) {
          paymentsArray = paymentsData.payments;
        }

        setPayments(paymentsArray);
        setTotalPages(paymentsData?.pagination?.pages || paymentsData?.pages || 1);
      } catch (error) {
        console.error('Error loading data:', error);
        setPayments([]);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, page]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('apiKey');
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      CREATED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      SETTLED: 'bg-blue-100 text-blue-800',
      EXPIRED: 'bg-red-100 text-red-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
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
              <Link href="/payments" className="text-primary-600 font-medium border-b-2 border-primary-600 pb-1">
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
          <p className="text-gray-600 mt-1">View and manage all your payment transactions</p>
        </div>

        {/* Payments Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No payments yet. Create your first payment to get started!
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.amount} {payment.currency}
                        </div>
                        <div className="text-xs text-gray-500">
                          Fee: {payment.feeAmount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-500">
                          {payment.paymentAddress.slice(0, 10)}...{payment.paymentAddress.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.expiresAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary ml-3"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-secondary rounded-r-none"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn btn-secondary rounded-l-none"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
