'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/components/ui/toast';
import { downloadInvoicePDF } from '@/lib/pdf-generator';
import { PaymentModal } from '@/components/payment-modal';
import Link from 'next/link';
import { formatDecimalCurrency } from '@/lib/currency';

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  issuedAt: Date;
  dueDate: Date | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  amount: number;
  currency: string;
  terms: string | null;
  notes: string | null;
  paymentLinkToken: string | null;
  paymentLinkExpiresAt: Date | null;
  paymentLinkViews: number;
  customer: {
    id: string;
    company: string | null;
    primaryName: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
  } | null;
  job: {
    id: string;
    title: string;
  } | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    amountCents: number;
    lineType: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    receivedAt: Date;
    method: string | null;
  }>;
  reminders: Array<{
    id: string;
    reminderType: string;
    status: string;
    sentAt: Date | null;
    error: string | null;
    createdAt: Date;
  }>;
}

interface InvoiceDetailClientProps {
  invoice: Invoice;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [showPaymentLink, setShowPaymentLink] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'sent':
        return <Badge variant="info">Sent</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleDownloadPDF = () => {
    try {
      if (!invoice.customer) {
        showToast('Cannot generate PDF: No customer assigned', 'error');
        return;
      }

      // Convert Decimal to number for PDF generation
      const pdfData = {
        ...invoice,
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        discountAmount: Number(invoice.discountAmount),
        amount: Number(invoice.amount),
        customer: invoice.customer,
      };

      downloadInvoicePDF(pdfData);
      showToast('Invoice PDF downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: invoice.amount,
          method: 'manual',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      showToast('Invoice marked as paid', 'success');
      router.refresh();
    } catch (error: any) {
      showToast(error.message || 'Failed to mark as paid', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePaymentLink = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payment-link`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to generate payment link');

      const data = await res.json();
      setPaymentLink(data.paymentLink);
      setShowPaymentLink(true);
      showToast('Payment link generated successfully', 'success');
      router.refresh();
    } catch (error) {
      console.error('Error generating payment link:', error);
      showToast('Failed to generate payment link', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPaymentLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      showToast('Payment link copied to clipboard', 'success');
    }
  };

  const sendReminder = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send-reminder`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send reminder');
      }

      showToast('Reminder sent successfully', 'success');
      router.refresh();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      showToast(error.message || 'Failed to send reminder', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const amountDue = invoice.amount - totalPaid;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Invoices
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Invoice {invoice.number || 'DRAFT'}
              </h1>
              <p className="text-gray-600 mt-1">
                {getStatusBadge(invoice.status)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleDownloadPDF}>
                Download PDF
              </Button>
              {invoice.status !== 'paid' && amountDue > 0 && (
                <>
                  <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)}>
                    Pay Now
                  </Button>
                  <Button variant="secondary" onClick={handleMarkAsPaid} loading={isProcessing} disabled={isProcessing}>
                    Mark as Paid
                  </Button>
                  <Button variant="secondary" onClick={generatePaymentLink} loading={isProcessing} disabled={isProcessing}>
                    Generate Payment Link
                  </Button>
                  {invoice.customer?.primaryEmail && (
                    <Button variant="secondary" onClick={sendReminder} loading={isProcessing} disabled={isProcessing}>
                      Send Reminder
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Link */}
        {(showPaymentLink || invoice.paymentLinkToken) && (
          <Card>
            <CardHeader title="Payment Link" />
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Share this link with your customer to accept payment:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentLink || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${invoice.paymentLinkToken}`}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                  <Button variant="secondary" onClick={copyPaymentLink}>
                    Copy Link
                  </Button>
                </div>
                {invoice.paymentLinkExpiresAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Expires: {new Date(invoice.paymentLinkExpiresAt).toLocaleDateString()} | Views: {invoice.paymentLinkViews}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Invoice Details */}
        <Card>
          <CardHeader title="Invoice Details" />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="font-medium">{invoice.number || 'DRAFT'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{invoice.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Issued Date</p>
                <p className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Info */}
        {invoice.customer && (
          <Card>
            <CardHeader title="Customer" />
            <div className="p-6">
              <Link href={`/customers/${invoice.customer.id}`} className="text-blue-600 hover:text-blue-700">
                <p className="font-medium text-lg">
                  {invoice.customer.company || invoice.customer.primaryName || 'Unnamed Customer'}
                </p>
              </Link>
              {invoice.customer.primaryEmail && (
                <p className="text-sm text-gray-600 mt-1">{invoice.customer.primaryEmail}</p>
              )}
              {invoice.customer.primaryPhone && (
                <p className="text-sm text-gray-600">{invoice.customer.primaryPhone}</p>
              )}
              {invoice.job && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Related Job:</p>
                  <Link href={`/jobs/${invoice.job.id}`} className="text-blue-600 hover:text-blue-700">
                    {invoice.job.title}
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Line Items */}
        <Card>
          <CardHeader title="Line Items" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {formatDecimalCurrency(item.unitPriceCents / 100, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {formatDecimalCurrency(item.amountCents / 100, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${(invoice.subtotal / 100).toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">-{formatDecimalCurrency(invoice.discountAmount / 100, invoice.currency)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatDecimalCurrency(invoice.taxAmount / 100, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatDecimalCurrency(invoice.amount / 100, invoice.currency)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid:</span>
                      <span className="font-medium">-${(totalPaid / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                      <span>Amount Due:</span>
                      <span>{formatDecimalCurrency(amountDue / 100, invoice.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Terms and Notes */}
        {(invoice.terms || invoice.notes) && (
          <Card>
            <CardHeader title="Additional Information" />
            <div className="p-6 space-y-4">
              {invoice.terms && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Terms</p>
                  <p className="text-sm text-gray-600 mt-1">{invoice.terms}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Notes</p>
                  <p className="text-sm text-gray-600 mt-1">{invoice.notes}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <Card>
            <CardHeader title="Payment History" />
            <div className="p-6">
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{formatDecimalCurrency(payment.amount / 100, payment.currency)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.receivedAt).toLocaleDateString()} • {payment.method || 'Manual'}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">Paid</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Reminder History */}
        {invoice.reminders.length > 0 && (
          <Card>
            <CardHeader title="Reminder History" />
            <div className="p-6">
              <div className="space-y-3">
                {invoice.reminders.map((reminder) => (
                  <div key={reminder.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{reminder.reminderType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">
                        {reminder.sentAt ? new Date(reminder.sentAt).toLocaleDateString() : new Date(reminder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reminder.status === 'sent' ? 'bg-green-100 text-green-800' :
                        reminder.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reminder.status}
                      </span>
                      {reminder.error && (
                        <p className="text-xs text-red-600 mt-1">{reminder.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        invoiceId={invoice.id}
        amount={Math.round(amountDue * 100)}
        invoiceNumber={invoice.number || 'DRAFT'}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

