// src/pages/dev/settings.tsx

/**
 * ⚙️ DEVELOPER SETTINGS - Developer Tools
 * 
 * Developer system configuration and settings
 */

import React, { useState } from 'react';
import DeveloperLayout from '@/components/DeveloperLayout';

export default function DeveloperSettings() {
  const [settings, setSettings] = useState({
    debugMode: true,
    verboseLogging: false,
    autoBackup: true,
    maintenanceMode: false,
    apiRateLimit: 1000,
    cacheTimeout: 300,
  });

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DeveloperLayout title="Developer Settings">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Developer Settings</h2>
          <p className="text-gray-400">Configure system behavior and development tools</p>
        </div>

        <div className="space-y-6">
          {/* System Settings */}
          <div className="bg-gray-700 rounded-lg p-6 border border-green-500/20">
            <h3 className="text-xl font-semibold text-green-400 mb-4">System Settings</h3>
            
            <div className="space-y-4">
              {/* Debug Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Debug Mode</label>
                  <p className="text-gray-400 text-sm">Enable detailed debugging information</p>
                </div>
                <button
                  onClick={() => handleSettingChange('debugMode', !settings.debugMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.debugMode ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Verbose Logging */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Verbose Logging</label>
                  <p className="text-gray-400 text-sm">Log all system activities</p>
                </div>
                <button
                  onClick={() => handleSettingChange('verboseLogging', !settings.verboseLogging)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.verboseLogging ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.verboseLogging ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Auto Backup</label>
                  <p className="text-gray-400 text-sm">Automatically backup database daily</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoBackup', !settings.autoBackup)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoBackup ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Maintenance Mode</label>
                  <p className="text-gray-400 text-sm">Put system in maintenance mode</p>
                </div>
                <button
                  onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="bg-gray-700 rounded-lg p-6 border border-green-500/20">
            <h3 className="text-xl font-semibold text-green-400 mb-4">Performance Settings</h3>
            
            <div className="space-y-4">
              {/* API Rate Limit */}
              <div>
                <label className="block text-white font-medium mb-2">API Rate Limit (requests/minute)</label>
                <input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-green-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Cache Timeout */}
              <div>
                <label className="block text-white font-medium mb-2">Cache Timeout (seconds)</label>
                <input
                  type="number"
                  value={settings.cacheTimeout}
                  onChange={(e) => handleSettingChange('cacheTimeout', parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-green-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Save Settings
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
}
