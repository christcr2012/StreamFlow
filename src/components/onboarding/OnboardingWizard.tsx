/**
 * Module: Onboarding Wizard
 * Purpose: Multi-step onboarding flow for new organizations
 * Scope: Owner-only first-run experience
 * Notes: Codex Phase 6 - Onboarding wizard
 */

import { useState } from 'react';
import { useRouter } from 'next/router';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  data: any;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to StreamFlow',
    description: 'Let\'s get your organization set up',
    component: WelcomeStep,
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Customize your organization\'s appearance',
    component: BrandingStep,
  },
  {
    id: 'hours',
    title: 'Business Hours',
    description: 'Set your operating hours',
    component: HoursStep,
  },
  {
    id: 'team',
    title: 'Invite Team',
    description: 'Add your team members',
    component: TeamStep,
  },
  {
    id: 'modules',
    title: 'Select Modules',
    description: 'Choose features for your organization',
    component: ModulesStep,
  },
  {
    id: 'complete',
    title: 'All Set!',
    description: 'You\'re ready to go',
    component: CompleteStep,
  },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<Record<string, any>>({});

  const handleNext = (stepData: any) => {
    setWizardData({ ...wizardData, [STEPS[currentStep].id]: stepData });
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // TODO: Save onboarding data to API
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      });

      // Redirect to dashboard
      router.push('/client/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const step = STEPS[currentStep];
  const StepComponent = step.component;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{step.description}</p>
          </div>

          <StepComponent
            onNext={handleNext}
            onBack={handleBack}
            data={wizardData[step.id] || {}}
          />
        </div>
      </div>
    </div>
  );
}

// Step Components

function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">👋</div>
        <p className="text-lg text-gray-700">
          Welcome! We'll help you set up your organization in just a few steps.
        </p>
      </div>
      <button
        onClick={() => onNext({})}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Get Started
      </button>
    </div>
  );
}

function BrandingStep({ onNext, onBack, data }: StepProps) {
  const [logo, setLogo] = useState(data.logo || '');
  const [primaryColor, setPrimaryColor] = useState(data.primaryColor || '#3B82F6');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL (optional)
        </label>
        <input
          type="url"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Color
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-20 rounded border border-gray-300"
          />
          <input
            type="text"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ logo, primaryColor })}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function HoursStep({ onNext, onBack, data }: StepProps) {
  const [hours, setHours] = useState(data.hours || {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: true },
    sunday: { open: '09:00', close: '17:00', closed: true },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {Object.entries(hours).map(([day, schedule]: [string, any]) => (
          <div key={day} className="flex items-center space-x-4">
            <div className="w-24 font-medium text-gray-700 capitalize">{day}</div>
            <input
              type="checkbox"
              checked={!schedule.closed}
              onChange={(e) => setHours({
                ...hours,
                [day]: { ...schedule, closed: !e.target.checked },
              })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            {!schedule.closed && (
              <>
                <input
                  type="time"
                  value={schedule.open}
                  onChange={(e) => setHours({
                    ...hours,
                    [day]: { ...schedule, open: e.target.value },
                  })}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={schedule.close}
                  onChange={(e) => setHours({
                    ...hours,
                    [day]: { ...schedule, close: e.target.value },
                  })}
                  className="px-3 py-1 border border-gray-300 rounded"
                />
              </>
            )}
            {schedule.closed && <span className="text-gray-400">Closed</span>}
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ hours })}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function TeamStep({ onNext, onBack }: StepProps) {
  const [teamMembers, setTeamMembers] = useState<Array<{ email: string; name: string; role: string }>>([
    { email: '', name: '', role: 'STAFF' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = () => {
    setTeamMembers([...teamMembers, { email: '', name: '', role: 'STAFF' }]);
  };

  const removeMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: string, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleSubmit = async () => {
    // Filter out empty entries
    const validMembers = teamMembers.filter(m => m.email && m.name);

    if (validMembers.length === 0) {
      // Skip if no members added
      onNext({ teamMembers: [] });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create users via API
      for (const member of validMembers) {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: member.email,
            name: member.name,
            role: member.role,
            sendInvite: true // Flag to send invitation email (stubbed for now)
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create user');
        }
      }

      onNext({ teamMembers: validMembers });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite Your Team</h3>
        <p className="text-gray-600">Add team members who will use StreamFlow. They'll receive an email with login instructions.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={member.name}
                onChange={(e) => updateMember(index, 'name', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="email@company.com"
                value={member.email}
                onChange={(e) => updateMember(index, 'email', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={member.role}
                onChange={(e) => updateMember(index, 'role', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            {teamMembers.length > 1 && (
              <button
                onClick={() => removeMember(index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addMember}
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        + Add Another Team Member
      </button>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ teamMembers: [] })}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Inviting...' : 'Invite Team'}
        </button>
      </div>
    </div>
  );
}

function ModulesStep({ onNext, onBack }: StepProps) {
  // Curated starter pack of essential features
  const availableModules = [
    {
      key: 'ai_lead_scoring',
      name: 'AI Lead Scoring',
      description: 'Intelligent lead prioritization and scoring',
      category: 'AI_ANALYTICS',
      monthlyCost: 45,
      recommended: true
    },
    {
      key: 'mobile_app',
      name: 'Mobile App Access',
      description: 'iOS and Android apps for field workers',
      category: 'MOBILE',
      monthlyCost: 0,
      recommended: true
    },
    {
      key: 'api_access',
      name: 'API Access',
      description: 'RESTful API for integrations',
      category: 'DEVELOPER_TOOLS',
      monthlyCost: 25,
      recommended: false
    },
    {
      key: 'advanced_reporting',
      name: 'Advanced Reporting',
      description: 'Custom reports and analytics dashboards',
      category: 'ANALYTICS',
      monthlyCost: 35,
      recommended: true
    },
    {
      key: 'sms_notifications',
      name: 'SMS Notifications',
      description: 'Text message alerts and reminders',
      category: 'COMMUNICATION',
      monthlyCost: 15,
      recommended: false
    },
    {
      key: 'document_generation',
      name: 'Document Generation',
      description: 'Automated proposals and contracts',
      category: 'AUTOMATION',
      monthlyCost: 20,
      recommended: true
    },
    {
      key: 'scheduling_optimization',
      name: 'Scheduling Optimization',
      description: 'AI-powered job scheduling and routing',
      category: 'AI_ANALYTICS',
      monthlyCost: 40,
      recommended: false
    },
    {
      key: 'inventory_management',
      name: 'Inventory Management',
      description: 'Track materials and equipment',
      category: 'OPERATIONS',
      monthlyCost: 30,
      recommended: false
    }
  ];

  const [selectedModules, setSelectedModules] = useState<string[]>(
    availableModules.filter(m => m.recommended).map(m => m.key)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleModule = (moduleKey: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleKey)
        ? prev.filter(k => k !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const totalMonthlyCost = availableModules
    .filter(m => selectedModules.includes(m.key))
    .reduce((sum, m) => sum + m.monthlyCost, 0);

  const handleSubmit = async () => {
    if (selectedModules.length === 0) {
      setError('Please select at least one module');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Enable selected modules via API
      for (const moduleKey of selectedModules) {
        const module = availableModules.find(m => m.key === moduleKey);
        if (!module) continue;

        const response = await fetch('/api/admin/feature-modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleKey: module.key,
            name: module.name,
            description: module.description,
            category: module.category,
            enabled: true,
            monthlyBudget: module.monthlyCost * 100, // Convert to cents
            config: {}
          })
        });

        if (!response.ok) {
          const data = await response.json();
          // Ignore "already exists" errors
          if (!data.error?.includes('already exists')) {
            throw new Error(data.error || 'Failed to enable module');
          }
        }
      }

      onNext({ selectedModules, totalMonthlyCost });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Features</h3>
        <p className="text-gray-600">Select the features you need. You can always add or remove features later.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableModules.map((module) => {
          const isSelected = selectedModules.includes(module.key);
          return (
            <div
              key={module.key}
              onClick={() => toggleModule(module.key)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              {module.recommended && (
                <span className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded">
                  Recommended
                </span>
              )}

              <div className="flex items-start space-x-3">
                <div className={`
                  mt-1 w-5 h-5 rounded border-2 flex items-center justify-center
                  ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
                `}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{module.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {module.monthlyCost === 0 ? 'Free' : `$${module.monthlyCost}/month`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Selected Features</p>
            <p className="text-lg font-semibold text-gray-900">{selectedModules.length} of {availableModules.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Estimated Monthly Cost</p>
            <p className="text-2xl font-bold text-blue-600">${totalMonthlyCost}</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedModules.length === 0}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ onNext }: StepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <p className="text-lg text-gray-700">
        You're all set! Let's start building your business.
      </p>
      <button
        onClick={() => onNext({})}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// PR-CHECKS:
// - [x] Onboarding wizard component created
// - [x] Multi-step flow with progress bar
// - [x] Welcome, branding, hours steps implemented
// - [x] Team and modules steps stubbed (TODO)
// - [x] Complete step with redirect

