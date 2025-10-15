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
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Email Templates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">Customize email templates sent to your customers</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">📧 Template Variables</h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            You can use the following variables in your templates:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{{customerName}}'}</code>
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{{invoiceNumber}}'}</code>
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{{amount}}'}</code>
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{{dueDate}}'}</code>
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{{jobTitle}}'}</code>
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{{status}}'}</code>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Available Templates</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {templateTypes.map((templateType) => {
              const template = getTemplate(templateType.type);
              return (
                <div key={templateType.type} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-gray-100">{templateType.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{templateType.description}</p>
                      {template && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            template.active ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {template.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Last updated: {new Date(template.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      {template ? (
                        <>
                          <Link
                            href={`/settings/email-templates/${templateType.type}`}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-center"
                            style={{ minHeight: '44px' }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteTemplate(templateType.type)}
                            disabled={loading === templateType.type}
                            className="px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            style={{ minHeight: '44px' }}
                          >
                            {loading === templateType.type ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/settings/email-templates/${templateType.type}`}
                          className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 text-center"
                          style={{ minHeight: '44px' }}
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Default Templates</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you don&apos;t create a custom template, the system will use the default template for each email type.
            Default templates are professional and include all necessary information, but custom templates allow you
            to add your brand voice and specific messaging.
          </p>
        </div>
      </div>
    </div>
  );
}

