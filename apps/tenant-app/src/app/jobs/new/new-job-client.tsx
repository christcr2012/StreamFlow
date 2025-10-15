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

interface FormData {
  title: string;
  description?: string;
  customerId?: string;
  status: string;
  scheduledAt?: string;
  notes?: string;
}

interface NewJobClientProps {
  customers: Customer[];
}

export function NewJobClient({ customers }: NewJobClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    customerId: '',
    status: 'scheduled',
    scheduledAt: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Job title is required';
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
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          customerId: formData.customerId || undefined,
          status: formData.status,
          scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
          notes: formData.notes || undefined,
          assignees: [],
          location: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
      }

      const result = await response.json();
      showToast('Job created successfully!', 'success');
      router.push(`/jobs/${result.id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to create job', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <Link href="/jobs" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 inline-block">
            ← Back to Jobs
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">New Job</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">Create a new service job</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader title="Job Information" />
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Job Title */}
              <Input
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Kitchen Renovation"
                required
                fullWidth
              />

              {/* Description */}
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                placeholder="Detailed description of the work to be performed..."
                rows={4}
                fullWidth
              />

              {/* Customer Selection */}
              <Select
                label="Customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                options={[
                  { value: '', label: 'No customer (optional)' },
                  ...customers.map(c => ({
                    value: c.id,
                    label: c.company || c.primaryName || 'Unnamed Customer',
                  })),
                ]}
                fullWidth
              />

              {/* Status */}
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                fullWidth
              />

              {/* Scheduled Date/Time */}
              <Input
                label="Scheduled Date & Time"
                name="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={handleChange}
                error={errors.scheduledAt}
                fullWidth
              />

              {/* Notes */}
              <Textarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                error={errors.notes}
                placeholder="Additional notes or special instructions..."
                rows={3}
                fullWidth
              />

              {/* Form Actions */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/jobs" className="w-full md:w-auto">
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
                  {isSubmitting ? 'Creating...' : 'Create Job'}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}

