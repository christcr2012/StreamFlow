'use client';

import { useState } from 'react';
import { z } from 'zod';

// Validation schema per binder1.md
const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  customerId: z.string().min(1, 'Customer is required'),
  estValue: z.number().min(0, 'Value must be positive').optional(),
  probability: z.number().min(0).max(100, 'Probability must be 0-100').optional(),
  closeDate: z.string().optional(),
  stage: z.string().default('prospecting'),
  ownerId: z.string().optional(),
  leadId: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface OpportunityCreateModalProps {
  onClose: () => void;
  onOpportunityCreated: (opportunity: any) => void;
  prefilledLeadId?: string;
  prefilledCustomerId?: string;
}

export default function OpportunityCreateModal({ 
  onClose, 
  onOpportunityCreated,
  prefilledLeadId,
  prefilledCustomerId,
}: OpportunityCreateModalProps) {
  const [formData, setFormData] = useState<OpportunityFormData>({
    title: '',
    customerId: prefilledCustomerId || '',
    estValue: undefined,
    probability: undefined,
    closeDate: '',
    stage: 'prospecting',
    ownerId: '',
    leadId: prefilledLeadId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    try {
      opportunitySchema.parse(formData);
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

      const response = await fetch('/api/tenant/crm/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `opp-create-${Date.now()}`,
        },
        body: JSON.stringify({
          ...formData,
          estValue: formData.estValue ? formData.estValue * 100 : undefined, // Convert to cents
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 422 && errorData.details) {
          setErrors(errorData.details);
          return;
        }

        throw new Error(errorData.message || 'Failed to create opportunity');
      }

      const newOpportunity = await response.json();
      onOpportunityCreated(newOpportunity);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof OpportunityFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Opportunity</h2>
          <p className="text-sm text-gray-600 mt-1">Add a new sales opportunity</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{serverError}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Q1 2025 HVAC Contract"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-600 mt-1">
                {errors.title}
              </p>
            )}
          </div>

          {/* Customer */}
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              id="customerId"
              value={formData.customerId}
              onChange={(e) => handleChange('customerId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.customerId}
              aria-describedby={errors.customerId ? 'customerId-error' : undefined}
            >
              <option value="">Select customer...</option>
              {/* TODO: Load customers from API */}
            </select>
            {errors.customerId && (
              <p id="customerId-error" className="text-sm text-red-600 mt-1">
                {errors.customerId}
              </p>
            )}
          </div>

          {/* Estimated Value */}
          <div>
            <label htmlFor="estValue" className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Value ($)
            </label>
            <input
              id="estValue"
              type="number"
              step="0.01"
              value={formData.estValue || ''}
              onChange={(e) => handleChange('estValue', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50000.00"
            />
          </div>

          {/* Probability */}
          <div>
            <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-1">
              Win Probability (%)
            </label>
            <input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability || ''}
              onChange={(e) => handleChange('probability', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.probability ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="50"
              aria-invalid={!!errors.probability}
            />
            {errors.probability && (
              <p className="text-sm text-red-600 mt-1">{errors.probability}</p>
            )}
          </div>

          {/* Close Date */}
          <div>
            <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <input
              id="closeDate"
              type="date"
              value={formData.closeDate}
              onChange={(e) => handleChange('closeDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Stage */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              id="stage"
              value={formData.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="prospecting">Prospecting</option>
              <option value="qualification">Qualification</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
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
            {loading ? 'Creating...' : 'Create Opportunity'}
          </button>
        </div>
      </div>
    </div>
  );
}

