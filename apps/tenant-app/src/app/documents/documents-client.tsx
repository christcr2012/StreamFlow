'use client';
import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download } from 'lucide-react';

export function DocumentsClient({ orgId }: { orgId: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(d => {
      setDocuments(d.documents || []);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/documents');
      const d = await r.json();
      setDocuments(d.documents || []);
    } finally {
      setLoading(false);
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', file.name);
      const res = await fetch('/api/documents', { method: 'POST', body: form });
      if (!res.ok) {
        console.error('Upload failed');
      } else {
        await refresh();
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>;

  const totalSize = documents.reduce((s, d) => s + d.size, 0);
  const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="min-h-screen bg-gray-50">
  <div className="bg-white border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-gray-900">Documents</h1><p className="text-gray-600 mt-1">Manage files and documents</p></div><div className="flex items-center gap-3"><input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} /><button disabled={uploading} onClick={() => fileInputRef.current?.click()} className={`px-4 py-2 rounded-lg flex items-center gap-2 ${uploading ? 'bg-gray-300 text-gray-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>{uploading ? 'Uploading...' : (<><Upload className="w-5 h-5" />Upload</>)}</button></div></div></div></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Total Documents</p><p className="text-2xl font-bold text-gray-900">{documents.length}</p></div>
          <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Storage Used</p><p className="text-2xl font-bold text-gray-900">{formatBytes(totalSize)}</p></div>
          <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Document Types</p><p className="text-2xl font-bold text-gray-900">{new Set(documents.map(d => d.type)).size}</p></div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b"><h3 className="text-lg font-semibold text-gray-900">Files</h3></div>
          <div className="divide-y divide-gray-200">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{formatBytes(doc.size)}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleString()}</span>
                    </div>
                    {doc.linkedTo && (
                      <p className="text-xs text-blue-600 mt-1">Linked to {doc.linkedTo.name}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600"><Download className="w-5 h-5" /></a>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
