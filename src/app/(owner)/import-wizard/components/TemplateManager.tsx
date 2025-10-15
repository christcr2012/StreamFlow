'use client';

import { useState, useEffect } from 'react';

export interface ImportTemplate {
  id: string;
  name: string;
  entityType: string;
  sourceFormat: string;
  fieldMappings: any[];
  transformRules?: any[];
  validationRules?: any[];
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface TemplateManagerProps {
  entityType: string;
  onSelectTemplate: (template: ImportTemplate) => void;
  onSaveTemplate: (name: string, mappings: any[], transforms?: any[], validations?: any[]) => Promise<void>;
  currentMappings?: any[];
  currentTransforms?: any[];
  currentValidations?: any[];
}

export function TemplateManager({
  entityType,
  onSelectTemplate,
  onSaveTemplate,
  currentMappings = [],
  currentTransforms = [],
  currentValidations = [],
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [entityType]);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/owner/import-templates?entityType=${entityType}`);
      const data = await res.json();

      if (data.ok) {
        setTemplates(data.templates || []);
      } else {
        setError(data.error || 'Failed to load templates');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSaveTemplate(templateName, currentMappings, currentTransforms, currentValidations);
      setShowSaveDialog(false);
      setTemplateName('');
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: ImportTemplate) => {
    onSelectTemplate(template);
  };

  if (loading && templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Import Templates</h3>
        {currentMappings.length > 0 && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save as Template
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Template List */}
      {templates.length > 0 ? (
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.sourceFormat.toUpperCase()} → {template.entityType}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {template.fieldMappings.length} field mappings
                    {template.lastUsedAt && ` • Last used ${new Date(template.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600">{template.useCount} uses</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No templates saved yet</p>
          <p className="text-sm mt-1">Complete a mapping to save your first template</p>
        </div>
      )}

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Import Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., QuickBooks Customer Import"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p>This template will save:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{currentMappings.length} field mappings</li>
                  {currentTransforms && currentTransforms.length > 0 && (
                    <li>{currentTransforms.length} transformation rules</li>
                  )}
                  {currentValidations && currentValidations.length > 0 && (
                    <li>{currentValidations.length} validation rules</li>
                  )}
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateName('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={loading || !templateName.trim()}
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

