// src/pages/leads/[id]/edit.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSafeMutation } from '@/lib/hooks/useSafeMutation';

type LeadFormData = {
  company: string;
  contactName: string;
  email: string;
  phoneE164: string;
  serviceCode: string;
  postalCode: string;
  sourceType: string;
  sourceDetail: string;
  notes: string;
  status: string;
};

type Lead = LeadFormData & {
  id: string;
  publicId: string | null;
  aiScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function EditLeadPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<LeadFormData>({
    company: '',
    contactName: '',
    email: '',
    phoneE164: '',
    serviceCode: '',
    postalCode: '',
    sourceType: 'MANUAL',
    sourceDetail: '',
    notes: '',
    status: 'NEW'
  });
  const [isLoadingLead, setIsLoadingLead] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch lead data
  useEffect(() => {
    if (!id) return;

    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/leads/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load lead');
        }
        const data = await response.json();
        setLead(data.lead);
        setFormData({
          company: data.lead.company || '',
          contactName: data.lead.contactName || '',
          email: data.lead.email || '',
          phoneE164: data.lead.phoneE164 || '',
          serviceCode: data.lead.serviceCode || '',
          postalCode: data.lead.postalCode || '',
          sourceType: data.lead.sourceType || 'MANUAL',
          sourceDetail: data.lead.sourceDetail || '',
          notes: data.lead.notes || '',
          status: data.lead.status || 'NEW'
        });
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setIsLoadingLead(false);
      }
    };

    fetchLead();
  }, [id]);

  const { mutate, isLoading, error } = useSafeMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead');
      }

      return response.json();
    },
    onSuccess: () => {
      router.push(`/leads/${id}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(formData);
  };

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoadingLead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (loadError || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{loadError || 'Lead not found'}</p>
          <Link href="/client/leads" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            ← Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Lead - {lead.company} - StreamFlow</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/leads/${id}`} className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
              ← Back to Lead
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
            <p className="text-gray-600 mt-2">{lead.company}</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
            {/* Company Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Code
                  </label>
                  <input
                    type="text"
                    value={formData.serviceCode}
                    onChange={(e) => handleChange('serviceCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneE164}
                    onChange={(e) => handleChange('phoneE164', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Type
                  </label>
                  <select
                    value={formData.sourceType}
                    onChange={(e) => handleChange('sourceType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MANUAL">Manual Entry</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="WEBSITE">Website</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="SAM_GOV">SAM.gov</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Detail
                  </label>
                  <input
                    type="text"
                    value={formData.sourceDetail}
                    onChange={(e) => handleChange('sourceDetail', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal Sent</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

