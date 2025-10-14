'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  templateType: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DefaultTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

interface Props {
  templateType: string;
  templateName: string;
  template: EmailTemplate | null;
  defaultTemplate: DefaultTemplate;
}

export default function EmailTemplateEditor({ templateType, templateName, template, defaultTemplate }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(template?.subject || defaultTemplate.subject);
  const [htmlBody, setHtmlBody] = useState(template?.htmlBody || defaultTemplate.htmlBody);
  const [textBody, setTextBody] = useState(template?.textBody || defaultTemplate.textBody);
  const [active, setActive] = useState(template?.active ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const url = template
        ? `/api/settings/email-templates/${templateType}`
        : `/api/settings/email-templates`;

      const method = template ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          subject,
          htmlBody,
          textBody,
          active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }

      alert('Template saved successfully!');
      router.push('/settings/email-templates');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(error.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    if (confirm('Are you sure you want to reset to the default template? This will discard your changes.')) {
      setSubject(defaultTemplate.subject);
      setHtmlBody(defaultTemplate.htmlBody);
      setTextBody(defaultTemplate.textBody);
    }
  };

  const previewHtml = htmlBody
    .replace(/\{\{customerName\}\}/g, 'John Doe')
    .replace(/\{\{invoiceNumber\}\}/g, 'INV-001')
    .replace(/\{\{amount\}\}/g, '$1,234.56')
    .replace(/\{\{dueDate\}\}/g, new Date().toLocaleDateString())
    .replace(/\{\{jobTitle\}\}/g, 'Sample Job')
    .replace(/\{\{status\}\}/g, 'In Progress');

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/settings/email-templates" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Email Templates
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{templateName}</h1>
          <p className="text-gray-600 mt-2">Customize the email template for {templateName.toLowerCase()}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-medium text-blue-900 mb-2">📧 Available Variables</h3>
          <div className="grid grid-cols-3 gap-2 text-sm text-blue-800">
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{customerName}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{invoiceNumber}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{amount}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{dueDate}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{jobTitle}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{status}}'}</code>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML Body
            </label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="HTML email body..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plain Text Body
            </label>
            <textarea
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Plain text email body..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Active (use this template instead of the default)
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Template'}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-2 border rounded hover:bg-gray-50"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={resetToDefault}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Preview (with sample data)</h2>
            <div className="border rounded p-4">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-600">Subject:</p>
                <p className="font-medium">{subject.replace(/\{\{customerName\}\}/g, 'John Doe').replace(/\{\{invoiceNumber\}\}/g, 'INV-001').replace(/\{\{amount\}\}/g, '$1,234.56').replace(/\{\{dueDate\}\}/g, new Date().toLocaleDateString()).replace(/\{\{jobTitle\}\}/g, 'Sample Job').replace(/\{\{status\}\}/g, 'In Progress')}</p>
              </div>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

