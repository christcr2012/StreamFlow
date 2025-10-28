// apps/tenant-app/src/app/payments/payments-client.tsx
// Payment processing UI - Phase 1

'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreVertical,
} from 'lucide-react';

interface PaymentsClientProps {
  orgId: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: string;
  method: string;
  cardLast4?: string;
  cardBrand?: string;
  bankLast4?: string;
  bankName?: string;
  failureReason?: string;
  stripePaymentIntentId: string;
  createdAt: string;
  paidAt: string | null;
}

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  bankName?: string;
  bankLast4?: string;
  isDefault: boolean;
  stripePaymentMethodId: string;
  createdAt: string;
}

export function PaymentsClient({ orgId }: PaymentsClientProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'methods'>('transactions');
  const [statusFilter, setStatusFilter] = useState('all');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchPaymentMethods();
  }, [statusFilter]);

  async function fetchPayments() {
    try {
      const res = await fetch(`/api/payments?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPaymentMethods() {
    try {
      const res = await fetch('/api/payments?type=methods');
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  }

  async function refundPayment(payment: Payment) {
    if (payment.status !== 'succeeded') return;
    const confirmRefund = window.confirm(`Refund payment ${payment.id}?`);
    if (!confirmRefund) return;
    setActing(payment.id);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', paymentId: payment.id }),
      });
      if (res.ok) {
        setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'refunded' } : p));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Refund failed');
      }
    } catch (e) {
      console.error('Refund error:', e);
      alert('Refund failed');
    } finally {
      setActing(null);
    }
  }

  const statusConfig = {
    succeeded: { icon: CheckCircle2, color: 'green', label: 'Succeeded' },
    pending: { icon: Clock, color: 'yellow', label: 'Pending' },
    failed: { icon: XCircle, color: 'red', label: 'Failed' },
    refunded: { icon: XCircle, color: 'red', label: 'Refunded' },
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const succeededCount = payments.filter((p) => p.status === 'succeeded').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="text-gray-600 mt-1">Manage payment processing and methods</p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Process Payment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            label="Successful Payments"
            value={succeededCount.toString()}
            icon={CheckCircle2}
            color="blue"
          />
          <StatsCard
            label="Pending"
            value={`$${pendingAmount.toFixed(2)}`}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            label="Payment Methods"
            value={paymentMethods.length.toString()}
            icon={CreditCard}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border mb-6">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('methods')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'methods'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment Methods
              </button>
            </nav>
          </div>

          {activeTab === 'transactions' && (
            <div className="p-4">
              {/* Filters */}
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ml-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => {
                      const config = statusConfig[payment.status as keyof typeof statusConfig];
                      const StatusIcon = config?.icon || Clock;

                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                            {payment.invoiceId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              {payment.method === 'card' ? (
                                <>
                                  {payment.cardBrand || 'Card'} {payment.cardLast4 ? `•••• ${payment.cardLast4}` : ''}
                                </>
                              ) : (
                                (payment.method || 'Payment')
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                ${config?.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                                ${config?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${config?.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                              `}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {config?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {payment.status === 'succeeded' ? (
                              <button disabled={acting === payment.id} onClick={() => refundPayment(payment)} className={`text-red-600 hover:text-red-800 ${acting === payment.id ? 'opacity-50' : ''}`}>
                                {acting === payment.id ? 'Refunding…' : 'Refund'}
                              </button>
                            ) : (
                              <button className="text-gray-400 hover:text-gray-600" title="More">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'methods' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h3>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          {method.type === 'card' ? (
                            <>
                              <p className="font-medium text-gray-900">
                                {method.cardBrand} •••• {method.cardLast4}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expires {method.cardExpMonth}/{method.cardExpYear}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900">
                                {method.bankName} •••• {method.bankLast4}
                              </p>
                              <p className="text-sm text-gray-500">Bank Account</p>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    {method.isDefault && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Default
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
