// src/pages/leads/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RFPUpload from '@/components/RFPUpload';
import ParsedRFPDisplay from '@/components/ParsedRFPDisplay';

type Lead = {
  id: string;
  publicId: string | null;
  sourceType: string | null;
  sourceDetail?: string | null;
  company: string | null;
  contactName: string | null;
  email: string | null;
  phoneE164: string | null;
  serviceCode: string | null;
  postalCode: string | null;
  zip: string | null;
  aiScore: number | null;
  systemGenerated?: boolean | null;
  convertedAt?: string | null;
  status: string | null;
  createdAt: string | null;
  notes?: string | null;
  enrichmentJson?: Record<string, unknown> | null;
};

type ParsedRFP = {
  scope: string;
  dueDate: string | null;
  walkthrough: string | null;
  insurance: string | null;
  bond: string | null;
  checklist: string[];
  summary: string;
  talkingPoints: string[];
};

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedRFP, setParsedRFP] = useState<(ParsedRFP & { originalText: string; filename: string }) | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    async function fetchLead() {
      try {
        setLoading(true);
        const response = await fetch(`/api/leads/${id}`);
        
        if (!response.ok) {
          throw new Error('Lead not found');
        }

        const data = await response.json();
        if (!data.ok) {
          throw new Error(data.error || 'Failed to fetch lead');
        }

        setLead(data.lead);
        
        // Check if lead already has RFP analysis
        const enrichment = data.lead.enrichmentJson as any;
        if (enrichment?.rfpAnalysis) {
          setParsedRFP(enrichment.rfpAnalysis);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [id]);

  const handleRFPParsed = (data: ParsedRFP & { originalText: string; filename: string }) => {
    setParsedRFP(data);
  };

  const handleSaveRFP = async () => {
    if (!parsedRFP || !lead) return;

    try {
      const response = await fetch('/api/rfp/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          parsedData: parsedRFP
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error);
      }

      // Refresh lead data
      router.reload();
      
    } catch (err: any) {
      alert('Failed to save RFP analysis: ' + err.message);
    }
  };

  const isRFPLead = lead?.sourceType === 'RFP' || lead?.systemGenerated;
  const hasExistingRFP = lead?.enrichmentJson && (lead.enrichmentJson as any)?.rfpAnalysis;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Lead Not Found
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {error || 'The requested lead could not be found.'}
          </p>
          <Link href="/leads" className="btn-primary">
            <span>← Back to Leads</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Lead {lead.publicId || lead.id.slice(0, 8)} • Mountain Vista</title>
      </Head>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/leads" className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                ← Back to Leads
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gradient">
              {lead.company || 'Unnamed Lead'}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {lead.publicId || `ID: ${lead.id.slice(0, 8)}`} • 
              {lead.sourceType === 'RFP' ? ' RFP Lead' : ' Manual Lead'} • 
              Score: {lead.aiScore || 'N/A'}
            </p>
          </div>
          
          <div className="flex gap-4">
            <button className="btn-secondary">
              <span>📝 Edit Lead</span>
            </button>
            <button className="btn-primary">
              <span>✅ Mark Converted</span>
            </button>
          </div>
        </div>

        {/* Lead Information */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Lead Information</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Contact details and lead metadata
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contact Name
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.contactName || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.email || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Phone
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.phoneE164 || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Service Code
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.serviceCode || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Location
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.postalCode || lead.zip || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Created
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Notes
              </label>
              <p className="text-sm p-3 rounded" style={{ 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border-primary)' 
              }}>
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* RFP Processing Section - Only show for RFP leads */}
        {isRFPLead && (
          <>
            {!hasExistingRFP && !parsedRFP && (
              <RFPUpload leadId={lead.id} onParsed={handleRFPParsed} />
            )}
            
            {parsedRFP && (
              <ParsedRFPDisplay 
                data={parsedRFP} 
                onSave={!hasExistingRFP ? handleSaveRFP : undefined}
              />
            )}
            
            {hasExistingRFP && !parsedRFP && (
              <div className="premium-card">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: 'var(--accent-success)' }}></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gradient">RFP Analysis Completed</h3>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      This lead already has RFP analysis attached. Refresh the page to view it.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Non-RFP Lead Message */}
        {!isRFPLead && (
          <div className="premium-card">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--text-tertiary)' }}></div>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  RFP Processing Not Available
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  RFP document parsing is only available for leads sourced from government RFPs and solicitations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}