// src/pages/provider/themes.tsx

/**
 * 🎨 PROVIDER THEME MANAGEMENT
 * 
 * Enterprise-grade theme customization interface for provider portal.
 * Allows providers to manage themes across all client organizations.
 * 
 * FEATURES:
 * - Real-time theme preview
 * - Bulk theme deployment
 * - Client-specific customization
 * - Theme usage analytics
 * - Brand asset management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProviderLayout from '@/components/ProviderLayout';
import { ThemeProvider, ThemeSelector, useTheme } from '@/lib/themes/ThemeProvider';
import { allThemes, type ThemeId } from '@/lib/themes/theme-definitions';

interface ClientOrg {
  id: string;
  name: string;
  currentTheme: ThemeId;
  customization: any;
  lastUpdated: string;
}

export default function ProviderThemesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOrg[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTheme, setPreviewTheme] = useState<ThemeId>('futuristic-green');

  useEffect(() => {
    loadClientThemes();
  }, []);

  const loadClientThemes = async () => {
    try {
      // TODO: Implement actual client theme loading
      // Mock data for now
      const mockClients: ClientOrg[] = [
        {
          id: 'org_1',
          name: 'Mountain Vista Cleaning',
          currentTheme: 'futuristic-green',
          customization: {},
          lastUpdated: '2024-01-15T10:30:00Z'
        },
        {
          id: 'org_2',
          name: 'Elite HVAC Services',
          currentTheme: 'crimson-command',
          customization: {},
          lastUpdated: '2024-01-14T15:45:00Z'
        },
        {
          id: 'org_3',
          name: 'Platinum Fencing Co',
          currentTheme: 'platinum-elite',
          customization: {},
          lastUpdated: '2024-01-13T09:15:00Z'
        }
      ];
      setClients(mockClients);
    } catch (error) {
      console.error('Failed to load client themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeToClient = async (clientId: string, themeId: ThemeId) => {
    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeId,
          orgId: clientId,
          isProvider: true
        }),
      });

      if (response.ok) {
        setClients(prev => prev.map(client => 
          client.id === clientId 
            ? { ...client, currentTheme: themeId, lastUpdated: new Date().toISOString() }
            : client
        ));
      }
    } catch (error) {
      console.error('Failed to apply theme to client:', error);
    }
  };

  const applyThemeToAllClients = async (themeId: ThemeId) => {
    for (const client of clients) {
      await applyThemeToClient(client.id, themeId);
    }
  };

  if (isLoading) {
    return (
      <ProviderLayout title="Theme Management">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ThemeProvider>
      <ProviderLayout title="Theme Management">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                Theme Management
              </h1>
              <p className="text-slate-400 mt-2">
                Manage themes across all client organizations
              </p>
            </div>
            <div className="flex space-x-4">
              <select
                value={previewTheme}
                onChange={(e) => setPreviewTheme(e.target.value as ThemeId)}
                className="px-4 py-2 bg-slate-800 border border-green-500/30 text-green-100 rounded-lg"
              >
                {Object.entries(allThemes).map(([id, theme]) => (
                  <option key={id} value={id}>{theme.name}</option>
                ))}
              </select>
              <button
                onClick={() => applyThemeToAllClients(previewTheme)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
              >
                Apply to All Clients
              </button>
            </div>
          </div>

          {/* Theme Gallery */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Available Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(allThemes).map(([themeId, theme]) => {
                const isPremium = theme.category === 'premium';
                const isRobinson = themeId === 'robinson-premium';
                return (
                  <div
                    key={themeId}
                    className={`bg-slate-800/50 rounded-xl border p-6 transition-all duration-300 ${
                      isPremium
                        ? 'border-blue-500/50 hover:border-blue-500/70 shadow-lg shadow-blue-500/20'
                        : 'border-slate-700 hover:border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg"
                          style={{ backgroundColor: theme.colors.accentPrimary }}
                        ></div>
                        <div>
                          <h3 className="font-semibold text-white">{theme.name}</h3>
                          <p className="text-xs text-slate-400 capitalize">{theme.category}</p>
                        </div>
                      </div>
                      {isPremium && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          ⭐ Premium
                        </span>
                      )}
                      {isRobinson && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          🏢 Enterprise
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-300 mb-4">{theme.description}</p>

                    {/* Color Palette Preview */}
                    <div className="flex space-x-2 mb-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.colors.accentPrimary }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.colors.accentSecondary }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.colors.accentTertiary }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.colors.textAccent }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">
                        Used by {clients.filter(c => c.currentTheme === themeId).length} clients
                      </div>
                      <button
                        onClick={() => applyThemeToAllClients(themeId as ThemeId)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          isPremium
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Theme Status */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Client Theme Status</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300">Organization</th>
                    <th className="text-left py-3 px-4 text-slate-300">Current Theme</th>
                    <th className="text-left py-3 px-4 text-slate-300">Last Updated</th>
                    <th className="text-left py-3 px-4 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{client.name}</div>
                        <div className="text-sm text-slate-400">{client.id}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: allThemes[client.currentTheme].colors.accentPrimary }}
                          ></div>
                          <span className="text-white">{allThemes[client.currentTheme].name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {new Date(client.lastUpdated).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={client.currentTheme}
                          onChange={(e) => applyThemeToClient(client.id, e.target.value as ThemeId)}
                          className="px-3 py-1 bg-slate-800 border border-slate-600 text-white rounded text-sm"
                        >
                          {Object.entries(allThemes).map(([id, theme]) => (
                            <option key={id} value={id}>{theme.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ProviderLayout>
    </ThemeProvider>
  );
}
