// src/pages/admin/feature-controls.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import AppNav from "@/components/AppNav";
import { useMe } from "@/lib/useMe";
import { hasPerm, PERMS } from "@/lib/rbacClient";

interface FeatureModule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  usage: {
    current: number;
    limit: number;
    unit: string;
  };
  cost: {
    current: number;
    monthly: number;
    currency: string;
  };
  config: Record<string, any>;
}

interface UsageMetrics {
  totalCost: number;
  monthlyBudget: number;
  utilizationRate: number;
  activeFeatures: number;
  totalFeatures: number;
}

export default function FeatureControls() {
  const { me, loading } = useMe();
  const [activeTab, setActiveTab] = useState('modules');
  const [modules, setModules] = useState<FeatureModule[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics>({
    totalCost: 0,
    monthlyBudget: 500,
    utilizationRate: 0,
    activeFeatures: 0,
    totalFeatures: 0
  });
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyLimit: 500,
    alertThreshold: 80,
    autoDisable: false,
    notifyOwners: true
  });

  // Enterprise feature modules with usage and cost tracking
  const defaultModules: FeatureModule[] = [
    {
      id: 'ai_lead_scoring',
      name: 'AI Lead Scoring',
      description: 'Intelligent lead prioritization and scoring system',
      category: 'AI & Analytics',
      enabled: true,
      usage: { current: 1250, limit: 5000, unit: 'API calls' },
      cost: { current: 12.50, monthly: 45.00, currency: 'USD' },
      config: {
        model: 'gpt-4',
        confidence_threshold: 0.75,
        batch_processing: true,
        real_time_scoring: true
      }
    },
    {
      id: 'automated_workflows',
      name: 'Automated Workflows',
      description: 'Business process automation and triggers',
      category: 'Automation',
      enabled: true,
      usage: { current: 850, limit: 2000, unit: 'executions' },
      cost: { current: 8.50, monthly: 25.00, currency: 'USD' },
      config: {
        max_concurrent: 10,
        retry_attempts: 3,
        timeout_seconds: 300,
        webhook_endpoints: 5
      }
    },
    {
      id: 'advanced_reporting',
      name: 'Advanced Reporting',
      description: 'Custom dashboards and analytical reports',
      category: 'Analytics',
      enabled: true,
      usage: { current: 45, limit: 100, unit: 'reports' },
      cost: { current: 4.50, monthly: 15.00, currency: 'USD' },
      config: {
        custom_dashboards: 5,
        scheduled_reports: 10,
        data_retention: 365,
        export_formats: ['PDF', 'CSV', 'Excel']
      }
    },
    {
      id: 'sms_notifications',
      name: 'SMS Notifications',
      description: 'Two-way SMS communication system',
      category: 'Communication',
      enabled: false,
      usage: { current: 0, limit: 1000, unit: 'messages' },
      cost: { current: 0, monthly: 20.00, currency: 'USD' },
      config: {
        twilio_integration: true,
        international: false,
        delivery_reports: true,
        opt_out_handling: true
      }
    },
    {
      id: 'email_marketing',
      name: 'Email Marketing',
      description: 'Automated email campaigns and newsletters',
      category: 'Marketing',
      enabled: false,
      usage: { current: 0, limit: 10000, unit: 'emails' },
      cost: { current: 0, monthly: 35.00, currency: 'USD' },
      config: {
        sendgrid_integration: true,
        template_builder: true,
        a_b_testing: false,
        analytics: true
      }
    },
    {
      id: 'document_ai',
      name: 'Document AI',
      description: 'Intelligent document processing and extraction',
      category: 'AI & Analytics',
      enabled: true,
      usage: { current: 125, limit: 500, unit: 'documents' },
      cost: { current: 6.25, monthly: 30.00, currency: 'USD' },
      config: {
        ocr_enabled: true,
        classification: true,
        data_extraction: true,
        supported_formats: ['PDF', 'DOC', 'IMG']
      }
    },
    {
      id: 'mobile_app',
      name: 'Mobile Application',
      description: 'Native mobile app for field workers',
      category: 'Mobile',
      enabled: true,
      usage: { current: 25, limit: 100, unit: 'active users' },
      cost: { current: 12.50, monthly: 50.00, currency: 'USD' },
      config: {
        ios_app: true,
        android_app: true,
        offline_mode: true,
        push_notifications: true
      }
    },
    {
      id: 'api_access',
      name: 'API Access',
      description: 'RESTful API for integrations and custom development',
      category: 'Developer Tools',
      enabled: true,
      usage: { current: 8500, limit: 25000, unit: 'requests' },
      cost: { current: 8.50, monthly: 25.00, currency: 'USD' },
      config: {
        rate_limit: 1000,
        webhook_support: true,
        documentation: true,
        sandbox_environment: true
      }
    }
  ];

  useEffect(() => {
    if (me && hasPerm(me, PERMS.FEATURE_TOGGLE)) {
      setModules(defaultModules);
      calculateMetrics(defaultModules);
    }
  }, [me]);

  const calculateMetrics = (moduleList: FeatureModule[]) => {
    const activeModules = moduleList.filter(m => m.enabled);
    const totalCost = activeModules.reduce((sum, m) => sum + m.cost.current, 0);
    const monthlyProjected = activeModules.reduce((sum, m) => sum + m.cost.monthly, 0);
    
    setMetrics({
      totalCost,
      monthlyBudget: budgetSettings.monthlyLimit,
      utilizationRate: (totalCost / budgetSettings.monthlyLimit) * 100,
      activeFeatures: activeModules.length,
      totalFeatures: moduleList.length
    });
  };

  const handleModuleToggle = async (moduleId: string) => {
    const updatedModules = modules.map(module => 
      module.id === moduleId 
        ? { ...module, enabled: !module.enabled }
        : module
    );
    
    setModules(updatedModules);
    calculateMetrics(updatedModules);

    // API call would go here
    console.log('Module toggle:', moduleId);
  };

  const handleConfigUpdate = async (moduleId: string, config: Record<string, any>) => {
    const updatedModules = modules.map(module => 
      module.id === moduleId 
        ? { ...module, config: { ...module.config, ...config } }
        : module
    );
    
    setModules(updatedModules);
    console.log('Config update:', moduleId, config);
  };

  const handleBudgetUpdate = (newSettings: typeof budgetSettings) => {
    setBudgetSettings(newSettings);
    calculateMetrics(modules);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'AI & Analytics': 'text-purple-400 bg-purple-900',
      'Automation': 'text-blue-400 bg-blue-900',
      'Analytics': 'text-green-400 bg-green-900',
      'Communication': 'text-yellow-400 bg-yellow-900',
      'Marketing': 'text-pink-400 bg-pink-900',
      'Mobile': 'text-indigo-400 bg-indigo-900',
      'Developer Tools': 'text-cyan-400 bg-cyan-900'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400 bg-gray-900';
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'text-red-400 bg-red-900';
    if (percentage >= 70) return 'text-yellow-400 bg-yellow-900';
    return 'text-green-400 bg-green-900';
  };

  if (loading) return <div>Loading...</div>;

  if (!me || !hasPerm(me, PERMS.FEATURE_TOGGLE)) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-gray-300 mt-2">You need Owner-level permissions to access Feature Controls.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Provider Feature Controls - Enterprise Administration</title>
      </Head>
      <AppNav />
      
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Provider Feature Controls</h1>
          <p className="text-gray-400">Manage platform modules, monitor usage, and control costs</p>
        </header>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">${metrics.totalCost.toFixed(2)}</div>
            <div className="text-gray-300">Current Month Cost</div>
            <div className="text-sm text-gray-500 mt-1">Budget: ${metrics.monthlyBudget}</div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">{metrics.utilizationRate.toFixed(1)}%</div>
            <div className="text-gray-300">Budget Utilization</div>
            <div className="text-sm text-gray-500 mt-1">
              {metrics.utilizationRate > 80 ? 'High usage' : 'Within limits'}
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-purple-400">{metrics.activeFeatures}</div>
            <div className="text-gray-300">Active Features</div>
            <div className="text-sm text-gray-500 mt-1">of {metrics.totalFeatures} available</div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">97%</div>
            <div className="text-gray-300">System Health</div>
            <div className="text-sm text-gray-500 mt-1">All systems operational</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'modules', name: 'Feature Modules', icon: '🔧' },
            { id: 'usage', name: 'Usage Analytics', icon: '📊' },
            { id: 'budget', name: 'Budget Management', icon: '💰' },
            { id: 'limits', name: 'Limits & Guardrails', icon: '⚠️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Feature Modules Tab */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-gray-900 border border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{module.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(module.category)}`}>
                      {module.category}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      module.enabled ? 'text-green-400 bg-green-900' : 'text-gray-400 bg-gray-700'
                    }`}>
                      {module.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">${module.cost.current.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">this month</div>
                    </div>
                    <button
                      onClick={() => handleModuleToggle(module.id)}
                      className={`px-4 py-2 text-sm rounded transition-colors ${
                        module.enabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {module.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 mb-4">{module.description}</p>

                <div className="grid grid-cols-3 gap-6">
                  {/* Usage Metrics */}
                  <div>
                    <h4 className="font-medium mb-2">Usage</h4>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">{module.usage.current} / {module.usage.limit}</span>
                      <span className="text-sm text-gray-400">{module.usage.unit}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getUsageColor(module.usage.current, module.usage.limit)} bg-opacity-75`}
                        style={{ width: `${Math.min((module.usage.current / module.usage.limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Cost Information */}
                  <div>
                    <h4 className="font-medium mb-2">Cost Projection</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Current: ${module.cost.current.toFixed(2)}</div>
                      <div>Monthly: ${module.cost.monthly.toFixed(2)}</div>
                      <div>Rate: ${(module.cost.current / module.usage.current).toFixed(4)} per {module.usage.unit.slice(0, -1)}</div>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div>
                    <h4 className="font-medium mb-2">Configuration</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      {Object.entries(module.config).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">
                      Configure →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Usage Analytics Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Usage Trends</h3>
              <div className="text-center text-gray-400 py-8">
                📊 Usage analytics charts would be displayed here
                <br />
                <span className="text-sm">Real-time usage monitoring, trends, and forecasting</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top Consuming Features</h3>
                <div className="space-y-3">
                  {modules.filter(m => m.enabled).sort((a, b) => b.cost.current - a.cost.current).slice(0, 5).map((module) => (
                    <div key={module.id} className="flex justify-between items-center">
                      <span className="text-white">{module.name}</span>
                      <span className="text-gray-400">${module.cost.current.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Usage Alerts</h3>
                <div className="space-y-3">
                  {modules.filter(m => m.enabled && (m.usage.current / m.usage.limit) > 0.7).map((module) => (
                    <div key={module.id} className="flex items-center space-x-3 p-2 bg-gray-800 rounded">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span className="text-white">{module.name}</span>
                      <span className="text-yellow-400 text-sm">
                        {((module.usage.current / module.usage.limit) * 100).toFixed(0)}% used
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget Management Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Budget Configuration</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Budget Limit</label>
                  <input
                    type="number"
                    value={budgetSettings.monthlyLimit}
                    onChange={(e) => handleBudgetUpdate({ ...budgetSettings, monthlyLimit: Number(e.target.value) })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Alert Threshold (%)</label>
                  <input
                    type="number"
                    value={budgetSettings.alertThreshold}
                    onChange={(e) => handleBudgetUpdate({ ...budgetSettings, alertThreshold: Number(e.target.value) })}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={budgetSettings.autoDisable}
                    onChange={(e) => handleBudgetUpdate({ ...budgetSettings, autoDisable: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                  />
                  <span>Auto-disable features when budget limit is reached</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={budgetSettings.notifyOwners}
                    onChange={(e) => handleBudgetUpdate({ ...budgetSettings, notifyOwners: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                  />
                  <span>Notify owners when alert threshold is reached</span>
                </label>
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                {modules.filter(m => m.enabled).map((module) => (
                  <div key={module.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <span className="text-white">{module.name}</span>
                      <span className="text-gray-400 text-sm ml-2">({module.category})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white">${module.cost.current.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">/ ${module.cost.monthly.toFixed(2)} projected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Limits & Guardrails Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Resource Limits</h3>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <span className="text-white">{module.name}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {module.usage.current} / {module.usage.limit} {module.usage.unit}
                      </span>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      Adjust Limit
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Safety Guardrails</h3>
              <div className="space-y-3">
                {[
                  { name: 'Cost spike protection', enabled: true, description: 'Auto-pause features with 10x usage increase' },
                  { name: 'Resource exhaustion prevention', enabled: true, description: 'Block requests when limits are reached' },
                  { name: 'Anomaly detection', enabled: true, description: 'Alert on unusual usage patterns' },
                  { name: 'Budget enforcement', enabled: budgetSettings.autoDisable, description: 'Disable features when budget is exceeded' }
                ].map((guardrail) => (
                  <div key={guardrail.name} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <div>
                      <span className="text-white">{guardrail.name}</span>
                      <div className="text-gray-400 text-sm">{guardrail.description}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      guardrail.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {guardrail.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}