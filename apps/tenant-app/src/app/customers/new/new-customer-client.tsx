'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { showToast } from '@/components/ui/toast';
import Link from 'next/link';

interface FormData {
  company?: string;
  primaryName: string;
  primaryEmail?: string;
  primaryPhone?: string;
  notes?: string;
}

export function NewCustomerClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    company: '',
    primaryName: '',
    primaryEmail: '',
    primaryPhone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.primaryName || formData.primaryName.trim() === '') {
      newErrors.primaryName = 'Primary contact name is required';
    }

    if (formData.primaryEmail && formData.primaryEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.primaryEmail)) {
        newErrors.primaryEmail = 'Invalid email address';
      }
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
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: [],
          billingSettings: {},
          contacts: [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer');
      }

      const result = await response.json();
      showToast('Customer created successfully!', 'success');
      router.push(`/customers/${result.id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create customer', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <Link href="/customers" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 inline-block">
            ← Back to Customers
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">New Customer</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">Add a new customer to your organization</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title="Customer Information" />
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Company Name */}
              <Input
                label="Company Name"
                name="company"
                value={formData.company}
                onChange={handleChange}
                error={errors.company}
                placeholder="Acme Corporation"
                fullWidth
              />

              {/* Primary Contact Name */}
              <Input
                label="Primary Contact Name"
                name="primaryName"
                value={formData.primaryName}
                onChange={handleChange}
                error={errors.primaryName}
                placeholder="John Doe"
                required
                fullWidth
              />

              {/* Primary Email */}
              <Input
                label="Primary Email"
                type="email"
                name="primaryEmail"
                value={formData.primaryEmail}
                onChange={handleChange}
                error={errors.primaryEmail}
                placeholder="john@acme.com"
                fullWidth
              />

              {/* Primary Phone */}
              <Input
                label="Primary Phone"
                type="tel"
                name="primaryPhone"
                value={formData.primaryPhone}
                onChange={handleChange}
                error={errors.primaryPhone}
                placeholder="+1 (555) 123-4567"
                fullWidth
              />

              {/* Notes */}
              <Textarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                error={errors.notes}
                placeholder="Additional information about this customer..."
                rows={4}
                fullWidth
              />

              {/* Form Actions */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/customers" className="w-full md:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    className="w-full"
                    style={{ minHeight: '44px' }}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                  style={{ minHeight: '44px' }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}

