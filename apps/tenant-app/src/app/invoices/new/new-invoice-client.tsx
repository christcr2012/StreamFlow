'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import Link from 'next/link';

interface Customer {
  id: string;
  company: string | null;
  primaryName: string | null;
}

interface Job {
  id: string;
  title: string;
  customer: {
    id: string;
    company: string | null;
    primaryName: string | null;
  } | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineType: string;
}

interface FormData {
  customerId?: string;
  jobId?: string;
  number?: string;
  terms?: string;
  notes?: string;
  dueDate?: string;
}

interface NewInvoiceClientProps {
  customers: Customer[];
  jobs: Job[];
}

export function NewInvoiceClient({ customers, jobs }: NewInvoiceClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    jobId: '',
    number: '',
    terms: '',
    notes: '',
    dueDate: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, lineType: 'service' },
  ]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map(i => parseInt(i.id))) + 1).toString();
    setLineItems(prev => [
      ...prev,
      { id: newId, description: '', quantity: 1, unitPrice: 0, lineType: 'service' },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      showToast('At least one line item with a description is required', 'error');
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const subtotal = calculateSubtotal();
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          jobId: formData.jobId || undefined,
          number: formData.number || undefined,
          status: 'draft',
          issuedAt: new Date().toISOString(),
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
          subtotal: Math.round(subtotal * 100), // Convert to cents
          taxAmount: 0,
          discountAmount: 0,
          amount: Math.round(subtotal * 100), // Convert to cents
          terms: formData.terms || undefined,
          notes: formData.notes || undefined,
          lineItems: lineItems
            .filter(item => item.description.trim() !== '')
            .map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: Math.round(item.unitPrice * 100), // Convert to cents
              amountCents: Math.round(item.quantity * item.unitPrice * 100), // Convert to cents
              lineType: item.lineType,
            })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const result = await response.json();
      showToast('Invoice created successfully!', 'success');
      router.push(`/invoices/${result.id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create invoice', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/invoices" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Invoices
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-600 mt-1">Create a new invoice for a customer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader title="Invoice Details" />
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Selection */}
                  <Select
                    label="Customer"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    error={errors.customerId}
                    options={[
                      { value: '', label: 'Select a customer' },
                      ...customers.map(c => ({
                        value: c.id,
                        label: c.company || c.primaryName || 'Unnamed Customer',
                      })),
                    ]}
                    required
                    fullWidth
                  />

                  {/* Job Selection */}
                  <Select
                    label="Related Job (Optional)"
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'No job' },
                      ...jobs.map(j => ({
                        value: j.id,
                        label: j.title,
                      })),
                    ]}
                    fullWidth
                  />

                  {/* Invoice Number */}
                  <Input
                    label="Invoice Number (Optional)"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="INV-001"
                    fullWidth
                  />

                  {/* Due Date */}
                  <Input
                    label="Due Date (Optional)"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    fullWidth
                  />
                </div>

                {/* Terms */}
                <Textarea
                  label="Payment Terms (Optional)"
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  placeholder="Net 30 days"
                  rows={2}
                  fullWidth
                />

                {/* Notes */}
                <Textarea
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes or instructions..."
                  rows={3}
                  fullWidth
                />
              </div>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader
                title="Line Items"
                action={
                  <Button type="button" variant="secondary" size="sm" onClick={addLineItem}>
                    + Add Line
                  </Button>
                }
              />
              <div className="p-6">
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                          fullWidth
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          fullWidth
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          fullWidth
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="px-3 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-900">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href="/invoices">
                <Button type="button" variant="secondary" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

