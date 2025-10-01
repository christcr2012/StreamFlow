'use client';

import { useState } from 'react';
import { z } from 'zod';

// Validation schema per binder1.md §2.3.1
const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  sourceId: z.string().optional(),
  ownerId: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadCreateModalProps {
  onClose: () => void;
  onLeadCreated: (lead: any) => void;
}

export default function LeadCreateModal({ onClose, onLeadCreated }: LeadCreateModalProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    sourceId: '',
    ownerId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    try {
      leadSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    // Submit to API
    try {
      setLoading(true);
      setServerError(null);

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `lead-create-${Date.now()}`, // Per binder1.md §3.3
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle 409 duplicate email (per binder1.md §2.3.1)
        if (response.status === 409) {
          setServerError('A lead with this email already exists.');
          return;
        }

        // Handle 422 field errors
        if (response.status === 422 && errorData.details) {
          setErrors(errorData.details);
          return;
        }

        throw new Error(errorData.message || 'Failed to create lead');
      }

      const newLead = await response.json();
      onLeadCreated(newLead);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Lead</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new lead to your pipeline</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{serverError}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Doe"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.company ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Acme Corp"
              aria-invalid={!!errors.company}
              aria-describedby={errors.company ? 'company-error' : undefined}
            />
            {errors.company && (
              <p id="company-error" className="text-sm text-red-600 mt-1">
                {errors.company}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john@acme.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Source */}
          <div>
            <label htmlFor="sourceId" className="block text-sm font-medium text-gray-700 mb-1">
              Lead Source
            </label>
            <select
              id="sourceId"
              value={formData.sourceId}
              onChange={(e) => handleChange('sourceId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select source...</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_call">Cold Call</option>
              <option value="event">Event</option>
              <option value="partner">Partner</option>
            </select>
          </div>

          {/* Owner (optional - can be assigned later) */}
          <div>
            <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="ownerId"
              value={formData.ownerId}
              onChange={(e) => handleChange('ownerId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {/* TODO: Load users from API */}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

