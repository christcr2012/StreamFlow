'use client';

import { useState } from 'react';
import { z } from 'zod';

// Validation schema per binder1.md
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  workPhone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  organizationId: z.string().optional(),
  isPrimary: z.boolean().default(false),
  linkedIn: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  ownerId: z.string().optional(),
  source: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactCreateModalProps {
  onClose: () => void;
  onContactCreated: (contact: any) => void;
  prefilledOrganizationId?: string;
}

export default function ContactCreateModal({ 
  onClose, 
  onContactCreated,
  prefilledOrganizationId,
}: ContactCreateModalProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    mobilePhone: '',
    workPhone: '',
    title: '',
    department: '',
    organizationId: prefilledOrganizationId || '',
    isPrimary: false,
    linkedIn: '',
    twitter: '',
    ownerId: '',
    source: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    try {
      contactSchema.parse(formData);
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

      const response = await fetch('/api/tenant/crm/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `contact-create-${Date.now()}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 422 && errorData.details) {
          setErrors(errorData.details);
          return;
        }

        throw new Error(errorData.message || 'Failed to create contact');
      }

      const newContact = await response.json();
      onContactCreated(newContact);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Contact</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new contact to your CRM</p>
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

          {/* Email & Phone Row */}
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="john@example.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

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
          </div>

          {/* Mobile & Work Phone Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Phone
              </label>
              <input
                id="mobilePhone"
                type="tel"
                value={formData.mobilePhone}
                onChange={(e) => handleChange('mobilePhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 987-6543"
              />
            </div>

            <div>
              <label htmlFor="workPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Work Phone
              </label>
              <input
                id="workPhone"
                type="tel"
                value={formData.workPhone}
                onChange={(e) => handleChange('workPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 111-2222"
              />
            </div>
          </div>

          {/* Title & Department Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Operations Manager"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Operations"
              />
            </div>
          </div>

          {/* Organization */}
          <div>
            <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              id="organizationId"
              value={formData.organizationId}
              onChange={(e) => handleChange('organizationId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {/* TODO: Load organizations from API */}
            </select>
          </div>

          {/* Primary Contact Checkbox */}
          <div className="flex items-center">
            <input
              id="isPrimary"
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => handleChange('isPrimary', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700">
              Primary contact for organization
            </label>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkedIn" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                id="linkedIn"
                type="url"
                value={formData.linkedIn}
                onChange={(e) => handleChange('linkedIn', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.linkedIn ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://linkedin.com/in/..."
                aria-invalid={!!errors.linkedIn}
              />
              {errors.linkedIn && (
                <p className="text-sm text-red-600 mt-1">{errors.linkedIn}</p>
              )}
            </div>

            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              <input
                id="twitter"
                type="url"
                value={formData.twitter}
                onChange={(e) => handleChange('twitter', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.twitter ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://twitter.com/..."
                aria-invalid={!!errors.twitter}
              />
              {errors.twitter && (
                <p className="text-sm text-red-600 mt-1">{errors.twitter}</p>
              )}
            </div>
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
            {loading ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

