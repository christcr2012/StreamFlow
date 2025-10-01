'use client';

import { useState } from 'react';
import { z } from 'zod';

// Validation schema per binder1.md
const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  annualRevenue: z.number().min(0).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  ownerId: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationCreateModalProps {
  onClose: () => void;
  onOrganizationCreated: (organization: any) => void;
}

export default function OrganizationCreateModal({ 
  onClose, 
  onOrganizationCreated,
}: OrganizationCreateModalProps) {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    domain: '',
    industry: '',
    size: undefined,
    annualRevenue: undefined,
    website: '',
    phone: '',
    email: '',
    ownerId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    try {
      organizationSchema.parse(formData);
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

      const response = await fetch('/api/tenant/crm/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `org-create-${Date.now()}`,
        },
        body: JSON.stringify({
          ...formData,
          annualRevenue: formData.annualRevenue ? formData.annualRevenue * 100 : undefined, // Convert to cents
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 422 && errorData.details) {
          setErrors(errorData.details);
          return;
        }

        throw new Error(errorData.message || 'Failed to create organization');
      }

      const newOrganization = await response.json();
      onOrganizationCreated(newOrganization);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof OrganizationFormData, value: any) => {
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
          <h2 className="text-xl font-semibold text-gray-900">Create New Organization</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new organization to your CRM</p>
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
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Acme Corporation"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Website & Domain Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://acme.com"
                aria-invalid={!!errors.website}
              />
              {errors.website && (
                <p className="text-sm text-red-600 mt-1">{errors.website}</p>
              )}
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                Domain
              </label>
              <input
                id="domain"
                type="text"
                value={formData.domain}
                onChange={(e) => handleChange('domain', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="acme.com"
              />
            </div>
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
                placeholder="info@acme.com"
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

          {/* Industry & Size Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select industry...</option>
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="landscaping">Landscaping</option>
                <option value="cleaning">Cleaning</option>
                <option value="roofing">Roofing</option>
                <option value="painting">Painting</option>
                <option value="carpentry">Carpentry</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                Company Size
              </label>
              <select
                id="size"
                value={formData.size || ''}
                onChange={(e) => handleChange('size', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select size...</option>
                <option value="small">Small (1-50)</option>
                <option value="medium">Medium (51-200)</option>
                <option value="large">Large (201-1000)</option>
                <option value="enterprise">Enterprise (1000+)</option>
              </select>
            </div>
          </div>

          {/* Annual Revenue */}
          <div>
            <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700 mb-1">
              Annual Revenue ($)
            </label>
            <input
              id="annualRevenue"
              type="number"
              step="1"
              value={formData.annualRevenue || ''}
              onChange={(e) => handleChange('annualRevenue', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000000"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the annual revenue in dollars</p>
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 mb-1">
              Owner
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
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </div>
    </div>
  );
}

