'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface TemplateType {
  type: string;
  name: string;
  description: string;
}

interface Props {
  templates: EmailTemplate[];
  templateTypes: TemplateType[];
}

export default function EmailTemplatesClient({ templates, templateTypes }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const getTemplate = (type: string) => {
    return templates.find(t => t.templateType === type);
  };

  const deleteTemplate = async (type: string) => {
    if (!confirm('Are you sure you want to delete this template? The system will use the default template instead.')) {
      return;
    }

    setLoading(type);
    try {
      const res = await fetch(`/api/settings/email-templates/${type}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete template');
      router.refresh();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-2">Customize email templates sent to your customers</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-medium text-blue-900 mb-2">📧 Template Variables</h3>
          <p className="text-sm text-blue-800 mb-2">
            You can use the following variables in your templates:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{customerName}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{invoiceNumber}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{amount}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{dueDate}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{jobTitle}}'}</code>
            <code className="bg-blue-100 px-2 py-1 rounded">{'{{status}}'}</code>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Available Templates</h2>
          </div>
          <div className="divide-y">
            {templateTypes.map((templateType) => {
              const template = getTemplate(templateType.type);
              return (
                <div key={templateType.type} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{templateType.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{templateType.description}</p>
                      {template && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {template ? (
                        <>
                          <Link
                            href={`/settings/email-templates/${templateType.type}`}
                            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteTemplate(templateType.type)}
                            disabled={loading === templateType.type}
                            className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            {loading === templateType.type ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/settings/email-templates/${templateType.type}`}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Create Custom Template
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Default Templates</h2>
          <p className="text-sm text-gray-600">
            If you don&apos;t create a custom template, the system will use the default template for each email type.
            Default templates are professional and include all necessary information, but custom templates allow you
            to add your brand voice and specific messaging.
          </p>
        </div>
      </div>
    </div>
  );
}

