'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Palette,
  Upload,
  Eye,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface BrandConfig {
  name?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customDomain?: string;
  emailTemplates?: {
    welcome?: string;
    invoice?: string;
    notification?: string;
  };
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

interface BrandingOrg {
  id: string;
  name: string;
  brandConfig: BrandConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface BrandingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'modern' | 'classic' | 'creative';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fontFamily: string;
  isPopular?: boolean;
}

interface BrandingStats {
  totalOrgs: number;
  orgsWithBranding: number;
  orgsWithLogo: number;
  orgsWithCustomColors: number;
  brandingAdoptionRate: number;
}

interface BrandingClientProps {
  initialConfigs: BrandingOrg[];
  initialStats: BrandingStats;
  templates: BrandingTemplate[];
}

export default function BrandingClient({ initialConfigs, initialStats, templates }: BrandingClientProps) {
  const [configs, setConfigs] = useState<BrandingOrg[]>(initialConfigs);
  const [stats, setStats] = useState<BrandingStats>(initialStats);
  const [selectedOrg, setSelectedOrg] = useState<BrandingOrg | null>(null);
  const [editingConfig, setEditingConfig] = useState<BrandConfig>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter organizations by search query
  const filteredConfigs = configs.filter((config) =>
    config.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle organization selection
  const handleSelectOrg = (org: BrandingOrg) => {
    setSelectedOrg(org);
    setEditingConfig(org.brandConfig || {});
    setShowTemplates(false);
    setShowPreview(false);
  };

  // Handle config update
  const handleUpdateConfig = (updates: Partial<BrandConfig>) => {
    setEditingConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedOrg) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/provider/branding/${selectedOrg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfig),
      });

      if (!response.ok) throw new Error('Failed to save');

      const { data } = await response.json();
      
      // Update local state
      setConfigs((prev) =>
        prev.map((c) => (c.id === selectedOrg.id ? { ...c, brandConfig: data.brandConfig, updatedAt: data.updatedAt } : c))
      );
      setSelectedOrg((prev) => (prev ? { ...prev, brandConfig: data.brandConfig, updatedAt: data.updatedAt } : null));

      // Refresh stats
      const statsResponse = await fetch('/api/provider/branding?stats=true');
      const { data: newStats } = await statsResponse.json();
      setStats(newStats);
    } catch (error) {
      console.error('Error saving branding config:', error);
      alert('Failed to save branding configuration');
    } finally {
      setSaving(false);
    }
  };

  // Handle template application
  const handleApplyTemplate = async (templateId: string) => {
    if (!selectedOrg) return;

    setSaving(true);
    try {
      const response = await fetch('/api/provider/branding/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: selectedOrg.id, templateId }),
      });

      if (!response.ok) throw new Error('Failed to apply template');

      const { data } = await response.json();
      
      // Update local state
      setEditingConfig(data.brandConfig);
      setConfigs((prev) =>
        prev.map((c) => (c.id === selectedOrg.id ? { ...c, brandConfig: data.brandConfig, updatedAt: data.updatedAt } : c))
      );
      setSelectedOrg((prev) => (prev ? { ...prev, brandConfig: data.brandConfig, updatedAt: data.updatedAt } : null));
      setShowTemplates(false);

      // Refresh stats
      const statsResponse = await fetch('/api/provider/branding?stats=true');
      const { data: newStats } = await statsResponse.json();
      setStats(newStats);
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          White-Label Management
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Customize branding, logos, colors, and domains for your organizations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Organizations</span>
            <Globe className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalOrgs}</div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>With Branding</span>
            <Palette className="h-5 w-5" style={{ color: 'var(--accent-success)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.orgsWithBranding}</div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>With Logo</span>
            <Upload className="h-5 w-5" style={{ color: 'var(--accent-info)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.orgsWithLogo}</div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Adoption Rate</span>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.brandingAdoptionRate}%</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Organizations</h2>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredConfigs.map((config) => (
                <div
                  key={config.id}
                  className="p-4 cursor-pointer transition-colors border-b"
                  style={{
                    borderColor: 'var(--border-secondary)',
                    background: selectedOrg?.id === config.id ? 'var(--surface-hover)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedOrg?.id !== config.id) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedOrg?.id !== config.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onClick={() => handleSelectOrg(config)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{config.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {config.brandConfig?.primaryColor ? 'Customized' : 'Default'}
                      </div>
                    </div>
                    {config.brandConfig?.logoUrl && (
                      <CheckCircle className="h-4 w-4" style={{ color: 'var(--accent-success)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branding Editor */}
        <div className="lg:col-span-2">
          {!selectedOrg ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}
            >
              <Palette className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Select an Organization
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Choose an organization from the list to customize its branding
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                >
                  <Sparkles className="h-4 w-4" />
                  Templates
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ml-auto"
                  style={{ background: 'var(--brand-gradient)', color: 'white' }}
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Templates Panel */}
              {showTemplates && (
                <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-accent)' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Branding Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-lg p-4 cursor-pointer transition-all"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{template.name}</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{template.category}</div>
                          </div>
                          {template.isPopular && (
                            <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'var(--accent-warning)', color: 'white' }}>
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{template.description}</p>
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded" style={{ background: template.colors.primary }} />
                          <div className="w-8 h-8 rounded" style={{ background: template.colors.secondary }} />
                          <div className="w-8 h-8 rounded" style={{ background: template.colors.accent }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Panel */}
              {showPreview && (
                <div className="rounded-xl p-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-accent)' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Preview</h3>
                  <div
                    className="rounded-lg p-6"
                    style={{
                      background: editingConfig.primaryColor || '#10b981',
                      color: 'white',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {editingConfig.logoUrl ? (
                        <Image src={editingConfig.logoUrl} alt="Logo" width={48} height={48} unoptimized className="h-12 w-12 rounded" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-white/20 flex items-center justify-center">
                          <Palette className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <div className="text-xl font-bold">{editingConfig.name || selectedOrg.name}</div>
                        <div className="text-sm opacity-80">{editingConfig.customDomain || 'example.com'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded p-3 bg-white/10">
                        <div className="text-xs opacity-80 mb-1">Primary</div>
                        <div className="font-mono text-xs">{editingConfig.primaryColor || '#10b981'}</div>
                      </div>
                      <div className="rounded p-3" style={{ background: editingConfig.secondaryColor || '#34d399' }}>
                        <div className="text-xs opacity-80 mb-1">Secondary</div>
                        <div className="font-mono text-xs">{editingConfig.secondaryColor || '#34d399'}</div>
                      </div>
                      <div className="rounded p-3" style={{ background: editingConfig.accentColor || '#6ee7b7' }}>
                        <div className="text-xs opacity-80 mb-1">Accent</div>
                        <div className="font-mono text-xs">{editingConfig.accentColor || '#6ee7b7'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Branding Configuration */}
              <div className="rounded-xl p-6" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Branding Configuration
                </h3>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Brand Name
                        </label>
                        <input
                          type="text"
                          value={editingConfig.name || ''}
                          onChange={(e) => handleUpdateConfig({ name: e.target.value })}
                          placeholder={selectedOrg.name}
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Custom Domain
                        </label>
                        <input
                          type="text"
                          value={editingConfig.customDomain || ''}
                          onChange={(e) => handleUpdateConfig({ customDomain: e.target.value })}
                          placeholder="app.example.com"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo & Favicon */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Logo & Favicon</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Logo URL
                        </label>
                        <input
                          type="text"
                          value={editingConfig.logoUrl || ''}
                          onChange={(e) => handleUpdateConfig({ logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Favicon URL
                        </label>
                        <input
                          type="text"
                          value={editingConfig.faviconUrl || ''}
                          onChange={(e) => handleUpdateConfig({ faviconUrl: e.target.value })}
                          placeholder="https://example.com/favicon.ico"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Color Scheme</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Primary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingConfig.primaryColor || '#10b981'}
                            onChange={(e) => handleUpdateConfig({ primaryColor: e.target.value })}
                            className="h-10 w-16 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingConfig.primaryColor || ''}
                            onChange={(e) => handleUpdateConfig({ primaryColor: e.target.value })}
                            placeholder="#10b981"
                            className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border-primary)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Secondary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingConfig.secondaryColor || '#34d399'}
                            onChange={(e) => handleUpdateConfig({ secondaryColor: e.target.value })}
                            className="h-10 w-16 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingConfig.secondaryColor || ''}
                            onChange={(e) => handleUpdateConfig({ secondaryColor: e.target.value })}
                            placeholder="#34d399"
                            className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border-primary)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Accent Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingConfig.accentColor || '#6ee7b7'}
                            onChange={(e) => handleUpdateConfig({ accentColor: e.target.value })}
                            className="h-10 w-16 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingConfig.accentColor || ''}
                            onChange={(e) => handleUpdateConfig({ accentColor: e.target.value })}
                            placeholder="#6ee7b7"
                            className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border-primary)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Typography</h4>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Font Family
                      </label>
                      <select
                        value={editingConfig.fontFamily || 'Inter'}
                        onChange={(e) => handleUpdateConfig({ fontFamily: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="Inter">Inter</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <Phone className="h-3 w-3 inline mr-1" />
                          Phone
                        </label>
                        <input
                          type="text"
                          value={editingConfig.contactInfo?.phone || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              contactInfo: { ...editingConfig.contactInfo, phone: e.target.value },
                            })
                          }
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <Mail className="h-3 w-3 inline mr-1" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={editingConfig.contactInfo?.email || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              contactInfo: { ...editingConfig.contactInfo, email: e.target.value },
                            })
                          }
                          placeholder="contact@example.com"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Address
                        </label>
                        <input
                          type="text"
                          value={editingConfig.contactInfo?.address || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              contactInfo: { ...editingConfig.contactInfo, address: e.target.value },
                            })
                          }
                          placeholder="123 Main St, City, State"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <Globe className="h-3 w-3 inline mr-1" />
                          Website
                        </label>
                        <input
                          type="url"
                          value={editingConfig.socialLinks?.website || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              socialLinks: { ...editingConfig.socialLinks, website: e.target.value },
                            })
                          }
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <Linkedin className="h-3 w-3 inline mr-1" />
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          value={editingConfig.socialLinks?.linkedin || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              socialLinks: { ...editingConfig.socialLinks, linkedin: e.target.value },
                            })
                          }
                          placeholder="https://linkedin.com/company/example"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <Twitter className="h-3 w-3 inline mr-1" />
                          Twitter
                        </label>
                        <input
                          type="url"
                          value={editingConfig.socialLinks?.twitter || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              socialLinks: { ...editingConfig.socialLinks, twitter: e.target.value },
                            })
                          }
                          placeholder="https://twitter.com/example"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          <Facebook className="h-3 w-3 inline mr-1" />
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={editingConfig.socialLinks?.facebook || ''}
                          onChange={(e) =>
                            handleUpdateConfig({
                              socialLinks: { ...editingConfig.socialLinks, facebook: e.target.value },
                            })
                          }
                          placeholder="https://facebook.com/example"
                          className="w-full px-3 py-2 rounded-lg"
                          style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

