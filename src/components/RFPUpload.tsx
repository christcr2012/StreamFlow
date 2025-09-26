// src/components/RFPUpload.tsx
import { useState } from 'react';

interface ParsedRFP {
  scope: string;
  dueDate: string | null;
  walkthrough: string | null;
  insurance: string | null;
  bond: string | null;
  checklist: string[];
  summary: string;
  talkingPoints: string[];
}

interface RFPUploadProps {
  leadId: string;
  onParsed: (data: ParsedRFP & { originalText: string; filename: string }) => void;
}

export default function RFPUpload({ leadId, onParsed }: RFPUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('useAI', useAI.toString());
      formData.append('leadId', leadId);

      const response = await fetch('/api/rfp/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to parse RFP');
      }

      onParsed(result.data);
      setFile(null);
      
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="premium-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
        <div>
          <h3 className="text-xl font-semibold text-gradient">RFP Document Parser</h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Upload PDF or DOCX files to extract key bid requirements automatically
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Select RFP Document
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileChange}
            className="input-field"
            disabled={uploading}
          />
          {file && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* AI Enhancement Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="useAI"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            disabled={uploading}
            className="w-4 h-4 rounded border-2"
            style={{ 
              borderColor: 'var(--border-accent)',
              accentColor: 'var(--brand-primary)'
            }}
          />
          <label htmlFor="useAI" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-medium">Enhanced AI Analysis</span>
            <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Generate strategic talking points and competitive insights
            </span>
          </label>
        </div>

        {/* Upload Button */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`btn-primary ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>
              {uploading ? '🔄 Processing...' : '📄 Parse RFP'}
            </span>
          </button>
          
          {file && !uploading && (
            <button
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="btn-outline"
            >
              <span>✕ Clear</span>
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div 
            className="px-3 py-2 rounded-lg text-sm"
            style={{ 
              background: 'rgba(239, 68, 68, 0.2)', 
              color: 'rgb(239, 68, 68)' 
            }}
          >
            {error}
          </div>
        )}

        {/* Instructions */}
        <div 
          className="text-xs p-3 rounded-lg"
          style={{ 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border-primary)' 
          }}
        >
          <strong>Supported formats:</strong> PDF, DOCX, DOC (max 10MB)<br />
          <strong>What we extract:</strong> Scope, due dates, site visits, insurance/bond requirements, bid checklist
        </div>
      </div>
    </div>
  );
}