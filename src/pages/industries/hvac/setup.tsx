// src/pages/industries/hvac/setup.tsx

/**
 * 🌡️ HVAC INDUSTRY SETUP & CONFIGURATION
 * 
 * Industry-specific setup for HVAC services including:
 * - Seasonal maintenance scheduling
 * - Equipment inventory tracking
 * - Emergency service dispatch
 * - Energy efficiency reporting
 * - Warranty management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/AppShell';
import { 
  CogIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  required: boolean;
}

interface HVACConfig {
  businessInfo: {
    name: string;
    license: string;
    serviceAreas: string[];
    specializations: string[];
  };
  serviceTypes: {
    residential: boolean;
    commercial: boolean;
    industrial: boolean;
    emergency: boolean;
  };
  equipmentTypes: string[];
  seasonalServices: {
    springMaintenance: boolean;
    summerPrep: boolean;
    fallInspection: boolean;
    winterEmergency: boolean;
  };
  pricingModel: 'hourly' | 'flat-rate' | 'contract' | 'hybrid';
  inventoryTracking: boolean;
  warrantyManagement: boolean;
}

export default function HVACSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<HVACConfig>({
    businessInfo: {
      name: '',
      license: '',
      serviceAreas: [],
      specializations: []
    },
    serviceTypes: {
      residential: false,
      commercial: false,
      industrial: false,
      emergency: false
    },
    equipmentTypes: [],
    seasonalServices: {
      springMaintenance: false,
      summerPrep: false,
      fallInspection: false,
      winterEmergency: false
    },
    pricingModel: 'hourly',
    inventoryTracking: false,
    warrantyManagement: false
  });

  const setupSteps: SetupStep[] = [
    {
      id: 'business-info',
      title: 'Business Information',
      description: 'Configure your HVAC business details and licensing',
      icon: CogIcon,
      completed: false,
      required: true
    },
    {
      id: 'service-types',
      title: 'Service Types',
      description: 'Select the types of HVAC services you provide',
      icon: ClipboardDocumentListIcon,
      completed: false,
      required: true
    },
    {
      id: 'equipment',
      title: 'Equipment & Inventory',
      description: 'Configure equipment types and inventory tracking',
      icon: CogIcon,
      completed: false,
      required: true
    },
    {
      id: 'scheduling',
      title: 'Seasonal Scheduling',
      description: 'Set up seasonal maintenance and service schedules',
      icon: CalendarIcon,
      completed: false,
      required: false
    },
    {
      id: 'pricing',
      title: 'Pricing & Billing',
      description: 'Configure your pricing model and billing preferences',
      icon: ChartBarIcon,
      completed: false,
      required: true
    },
    {
      id: 'features',
      title: 'Advanced Features',
      description: 'Enable warranty management and additional features',
      icon: ShieldCheckIcon,
      completed: false,
      required: false
    }
  ];

  const hvacSpecializations = [
    'Residential HVAC',
    'Commercial HVAC',
    'Industrial Systems',
    'Refrigeration',
    'Ductwork',
    'Heat Pumps',
    'Boiler Systems',
    'Air Quality',
    'Energy Audits',
    'Smart Thermostats'
  ];

  const equipmentTypes = [
    'Air Conditioners',
    'Furnaces',
    'Heat Pumps',
    'Boilers',
    'Ductwork',
    'Thermostats',
    'Air Filters',
    'Refrigeration Units',
    'Ventilation Systems',
    'Air Quality Equipment'
  ];

  const handleNext = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Save configuration and redirect to dashboard
    try {
      const response = await fetch('/api/industries/hvac/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        router.push('/industries/hvac/dashboard');
      }
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };

  const renderStepContent = () => {
    switch (setupSteps[currentStep].id) {
      case 'business-info':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={config.businessInfo.name}
                onChange={(e) => setConfig({
                  ...config,
                  businessInfo: { ...config.businessInfo, name: e.target.value }
                })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="ABC HVAC Services"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                License Number
              </label>
              <input
                type="text"
                value={config.businessInfo.license}
                onChange={(e) => setConfig({
                  ...config,
                  businessInfo: { ...config.businessInfo, license: e.target.value }
                })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="HVAC-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Specializations
              </label>
              <div className="grid grid-cols-2 gap-3">
                {hvacSpecializations.map((spec) => (
                  <label key={spec} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.businessInfo.specializations.includes(spec)}
                      onChange={(e) => {
                        const specializations = e.target.checked
                          ? [...config.businessInfo.specializations, spec]
                          : config.businessInfo.specializations.filter(s => s !== spec);
                        setConfig({
                          ...config,
                          businessInfo: { ...config.businessInfo, specializations }
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-slate-300 text-sm">{spec}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'service-types':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(config.serviceTypes).map(([type, enabled]) => (
                <div key={type} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        serviceTypes: { ...config.serviceTypes, [type]: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium text-white capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-slate-400">
                        {type === 'residential' && 'Single-family homes and apartments'}
                        {type === 'commercial' && 'Office buildings and retail spaces'}
                        {type === 'industrial' && 'Factories and warehouses'}
                        {type === 'emergency' && '24/7 emergency repair services'}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'equipment':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Equipment Types You Service
              </label>
              <div className="grid grid-cols-2 gap-3">
                {equipmentTypes.map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.equipmentTypes.includes(equipment)}
                      onChange={(e) => {
                        const equipmentTypes = e.target.checked
                          ? [...config.equipmentTypes, equipment]
                          : config.equipmentTypes.filter(eq => eq !== equipment);
                        setConfig({ ...config, equipmentTypes });
                      }}
                      className="rounded"
                    />
                    <span className="text-slate-300 text-sm">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.inventoryTracking}
                  onChange={(e) => setConfig({ ...config, inventoryTracking: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="font-medium text-white">Enable Inventory Tracking</div>
                  <div className="text-sm text-slate-400">
                    Track parts, supplies, and equipment inventory levels
                  </div>
                </div>
              </label>
            </div>
          </div>
        );

      case 'scheduling':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(config.seasonalServices).map(([service, enabled]) => (
                <div key={service} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setConfig({
                        ...config,
                        seasonalServices: { ...config.seasonalServices, [service]: e.target.checked }
                      })}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium text-white">
                        {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-sm text-slate-400">
                        {service === 'springMaintenance' && 'Spring system tune-ups and cleaning'}
                        {service === 'summerPrep' && 'Summer cooling system preparation'}
                        {service === 'fallInspection' && 'Fall heating system inspection'}
                        {service === 'winterEmergency' && 'Winter emergency heating services'}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pricing Model
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'hourly', label: 'Hourly Rate', desc: 'Charge by the hour for labor' },
                  { value: 'flat-rate', label: 'Flat Rate', desc: 'Fixed pricing per service type' },
                  { value: 'contract', label: 'Contract', desc: 'Annual maintenance contracts' },
                  { value: 'hybrid', label: 'Hybrid', desc: 'Combination of pricing models' }
                ].map((model) => (
                  <label key={model.value} className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <input
                      type="radio"
                      name="pricingModel"
                      value={model.value}
                      checked={config.pricingModel === model.value}
                      onChange={(e) => setConfig({ ...config, pricingModel: e.target.value as any })}
                      className="rounded"
                    />
                    <div>
                      <div className="font-medium text-white">{model.label}</div>
                      <div className="text-sm text-slate-400">{model.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.warrantyManagement}
                  onChange={(e) => setConfig({ ...config, warrantyManagement: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <div className="font-medium text-white">Warranty Management</div>
                  <div className="text-sm text-slate-400">
                    Track equipment warranties and service agreements
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-blue-300 mb-4">🎉 Setup Complete!</h3>
              <p className="text-slate-300 mb-4">
                Your HVAC business is ready to be configured with industry-specific features:
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span>Seasonal maintenance scheduling</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span>Equipment-specific job templates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span>Emergency dispatch system</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span>Energy efficiency reporting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span>Parts inventory management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  <span>Warranty tracking system</span>
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2">
              🌡️ HVAC Services Setup
            </h1>
            <p className="text-slate-400">
              Configure your HVAC business for optimal workflow management
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {setupSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-slate-600 text-slate-400'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < setupSteps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      index < currentStep ? 'bg-blue-500' : 'bg-slate-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-white">{setupSteps[currentStep].title}</h2>
              <p className="text-slate-400">{setupSteps[currentStep].description}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8 mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {currentStep === setupSteps.length - 1 ? (
              <button
                onClick={handleComplete}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
              >
                <span>Complete Setup</span>
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
              >
                <span>Next</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
