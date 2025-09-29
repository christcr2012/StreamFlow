// src/pages/provider/branding.tsx

/**
 * 🎨 WHITE-LABEL BRANDING MANAGEMENT
 * 
 * Enterprise-grade white-label branding and customization system.
 * Allows providers to manage client branding across all instances.
 * 
 * FEATURES:
 * - Custom domain management
 * - Brand asset management (logos, colors, fonts)
 * - Email template customization
 * - Portal theming and styling
 * - Multi-tenant brand isolation
 * - Brand compliance monitoring
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProviderLayout from '@/components/ProviderLayout';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BrandConfig {
  id: string;
  clientId: string;
  clientName: string;
  brandName: string;
  domain?: string;
  customDomain?: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  emailTemplates: {
    welcome: string;
    invoice: string;
    notification: string;
  };
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  isActive: boolean;
  lastUpdated: string;
}

interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  category: 'professional' | 'modern' | 'classic' | 'creative';
}

export default function BrandingManagementPage() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BrandTemplate | null>(null);

  // Fetch branding data
  const { data: brandingData, error, mutate } = useSWR('/api/provider/branding', fetcher);
  const { data: templatesData } = useSWR('/api/provider/branding/templates', fetcher);

  const brandConfigs: BrandConfig[] = brandingData?.brandConfigs || [];
  const templates: BrandTemplate[] = templatesData?.templates || [];

  const selectedBrandConfig = selectedClient 
    ? brandConfigs.find(config => config.clientId === selectedClient)
    : null;

  const updateBrandConfig = async (clientId: string, updates: Partial<BrandConfig>) => {
    try {
      const response = await fetch(`/api/provider/branding/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        mutate(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to update brand config:', error);
    }
  };

  const applyTemplate = async (clientId: string, template: BrandTemplate) => {
    const updates = {
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
      accentColor: template.colors.accent,
    };

    await updateBrandConfig(clientId, updates);
    setShowTemplateModal(false);
  };

  const uploadAsset = async (clientId: string, assetType: 'logo' | 'favicon', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', assetType);

    try {
      const response = await fetch(`/api/provider/branding/${clientId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        await updateBrandConfig(clientId, { [assetType]: result.url });
      }
    } catch (error) {
      console.error('Failed to upload asset:', error);
    }
  };

  const generateCustomDomain = (brandName: string) => {
    return brandName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.streamflow.app';
  };

  return (
    <ProviderLayout title="Branding Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              🎨 White-Label Branding
            </h1>
            <p className="text-slate-400 mt-2">
              Manage client branding and customization across all instances
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
            >
              Brand Templates
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300">
              Export Branding
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Clients</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {brandConfigs.map((config) => (
                  <button
                    key={config.clientId}
                    onClick={() => setSelectedClient(config.clientId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedClient === config.clientId
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-medium">{config.clientName}</div>
                    <div className="text-sm text-slate-400">{config.brandName}</div>
                    {config.customDomain && (
                      <div className="text-xs text-green-400">{config.customDomain}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brand Configuration */}
          <div className="lg:col-span-3">
            {selectedBrandConfig ? (
              <div className="space-y-6">
                {/* Navigation Tabs */}
                <div className="border-b border-green-500/20">
                  <nav className="flex space-x-8">
                    {[
                      { id: 'overview', label: 'Overview', icon: '📊' },
                      { id: 'assets', label: 'Assets', icon: '🖼️' },
                      { id: 'colors', label: 'Colors & Fonts', icon: '🎨' },
                      { id: 'domains', label: 'Domains', icon: '🌐' },
                      { id: 'templates', label: 'Email Templates', icon: '📧' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 border-b-2 ${
                          activeTab === tab.id
                            ? 'border-green-500 text-green-400'
                            : 'border-transparent text-slate-400 hover:text-green-400'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Brand Overview</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Brand Name
                          </label>
                          <input
                            type="text"
                            value={selectedBrandConfig.brandName}
                            onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { brandName: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            value={selectedBrandConfig.contactInfo.email || ''}
                            onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, {
                              contactInfo: { ...selectedBrandConfig.contactInfo, email: e.target.value }
                            })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={selectedBrandConfig.contactInfo.phone || ''}
                            onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, {
                              contactInfo: { ...selectedBrandConfig.contactInfo, phone: e.target.value }
                            })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Website URL
                          </label>
                          <input
                            type="url"
                            value={selectedBrandConfig.socialLinks.website || ''}
                            onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, {
                              socialLinks: { ...selectedBrandConfig.socialLinks, website: e.target.value }
                            })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            LinkedIn URL
                          </label>
                          <input
                            type="url"
                            value={selectedBrandConfig.socialLinks.linkedin || ''}
                            onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, {
                              socialLinks: { ...selectedBrandConfig.socialLinks, linkedin: e.target.value }
                            })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Business Address
                          </label>
                          <textarea
                            value={selectedBrandConfig.contactInfo.address || ''}
                            onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, {
                              contactInfo: { ...selectedBrandConfig.contactInfo, address: e.target.value }
                            })}
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assets Tab */}
                {activeTab === 'assets' && (
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Brand Assets</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Logo</h3>
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                          {selectedBrandConfig.logo ? (
                            <div>
                              <img 
                                src={selectedBrandConfig.logo} 
                                alt="Brand Logo" 
                                className="max-h-24 mx-auto mb-4"
                              />
                              <button className="text-green-400 hover:text-green-300 text-sm">
                                Replace Logo
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-4xl mb-4">🖼️</div>
                              <p className="text-slate-400 mb-4">Upload brand logo</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadAsset(selectedBrandConfig.clientId, 'logo', file);
                                }}
                                className="hidden"
                                id="logo-upload"
                              />
                              <label
                                htmlFor="logo-upload"
                                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer"
                              >
                                Choose File
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Favicon</h3>
                        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                          {selectedBrandConfig.favicon ? (
                            <div>
                              <img 
                                src={selectedBrandConfig.favicon} 
                                alt="Favicon" 
                                className="w-8 h-8 mx-auto mb-4"
                              />
                              <button className="text-green-400 hover:text-green-300 text-sm">
                                Replace Favicon
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-4xl mb-4">🔖</div>
                              <p className="text-slate-400 mb-4">Upload favicon (32x32)</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadAsset(selectedBrandConfig.clientId, 'favicon', file);
                                }}
                                className="hidden"
                                id="favicon-upload"
                              />
                              <label
                                htmlFor="favicon-upload"
                                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer"
                              >
                                Choose File
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Colors & Fonts Tab */}
                {activeTab === 'colors' && (
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Colors & Typography</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Brand Colors</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Primary Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={selectedBrandConfig.primaryColor}
                                onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { primaryColor: e.target.value })}
                                className="w-12 h-12 rounded-lg border border-slate-600"
                              />
                              <input
                                type="text"
                                value={selectedBrandConfig.primaryColor}
                                onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { primaryColor: e.target.value })}
                                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Secondary Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={selectedBrandConfig.secondaryColor}
                                onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { secondaryColor: e.target.value })}
                                className="w-12 h-12 rounded-lg border border-slate-600"
                              />
                              <input
                                type="text"
                                value={selectedBrandConfig.secondaryColor}
                                onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { secondaryColor: e.target.value })}
                                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Accent Color
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={selectedBrandConfig.accentColor}
                                onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { accentColor: e.target.value })}
                                className="w-12 h-12 rounded-lg border border-slate-600"
                              />
                              <input
                                type="text"
                                value={selectedBrandConfig.accentColor}
                                onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { accentColor: e.target.value })}
                                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Typography</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Font Family
                            </label>
                            <select
                              value={selectedBrandConfig.fontFamily}
                              onChange={(e) => updateBrandConfig(selectedBrandConfig.clientId, { fontFamily: e.target.value })}
                              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                            >
                              <option value="Inter">Inter (Default)</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Open Sans">Open Sans</option>
                              <option value="Lato">Lato</option>
                              <option value="Montserrat">Montserrat</option>
                              <option value="Poppins">Poppins</option>
                            </select>
                          </div>

                          <div className="p-4 bg-slate-800/50 rounded-lg">
                            <h4 className="text-white font-medium mb-2">Preview</h4>
                            <div 
                              style={{ 
                                fontFamily: selectedBrandConfig.fontFamily,
                                color: selectedBrandConfig.primaryColor 
                              }}
                            >
                              <p className="text-lg font-bold mb-2">Heading Example</p>
                              <p className="text-sm">This is how your brand typography will look in the client portal.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other tabs placeholder */}
                {activeTab !== 'overview' && activeTab !== 'assets' && activeTab !== 'colors' && (
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8 text-center">
                    <div className="text-4xl mb-4">🚧</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Configuration
                    </h3>
                    <p className="text-slate-400">Advanced branding features coming soon...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8 text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a Client</h3>
                <p className="text-slate-400">Choose a client from the list to manage their branding configuration</p>
              </div>
            )}
          </div>
        </div>

        {/* Brand Templates Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 rounded-2xl border border-green-500/20 p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Brand Templates</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-green-500/50 transition-colors">
                    <div className="aspect-video bg-gradient-to-br rounded-lg mb-4 p-4 flex items-center justify-center"
                         style={{ 
                           background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary})` 
                         }}>
                      <div className="text-white font-bold text-lg">{template.name}</div>
                    </div>
                    <h3 className="text-white font-medium mb-2">{template.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: template.colors.primary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: template.colors.secondary }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: template.colors.accent }}
                        ></div>
                      </div>
                      <button
                        onClick={() => selectedClient && applyTemplate(selectedClient, template)}
                        disabled={!selectedClient}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
