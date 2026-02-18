'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, paymentsAPI } from '@/lib/api';
import { CreditCard, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const paymentsData = await paymentsAPI.getPayments(page, 10);

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      CREATED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
      SETTLED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      EXPIRED: 'bg-red-500/10 text-red-400 border-red-500/20',
      FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Payments</h1>
          <p className="text-gray-400 mt-2">Manage and track all your payment transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-lg">
            <span className="text-sm text-gray-400">Total: </span>
            <span className="text-sm font-semibold text-brand-400">{payments.length} payments</span>
          </div>
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="card">
        {payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No payments yet</h3>
            <p className="text-gray-400 text-sm">
              Your payment transactions will appear here once customers start making payments.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment Address
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono font-medium text-gray-200">
                          #{payment.orderId}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-100">
                            {payment.amount} USDT
                          </span>
                          <span className="text-xs text-gray-500">
                            Net: {payment.netAmount} USDT
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-gray-400">
                            {payment.paymentAddress?.slice(0, 6)}...{payment.paymentAddress?.slice(-4)}
                          </span>
                          <a
                            href={`https://bscscan.com/address/${payment.paymentAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-400 hover:text-brand-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-400">
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors opacity-0 group-hover:opacity-100">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                <div className="text-sm text-gray-400">
                  Page <span className="font-semibold text-gray-200">{page}</span> of{' '}
                  <span className="font-semibold text-gray-200">{totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-300" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
