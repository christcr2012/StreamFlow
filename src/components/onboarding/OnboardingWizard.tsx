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

// TODO: Implement remaining steps
function TeamStep({ onNext, onBack }: StepProps) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">Team invitation step - TODO</p>
      <div className="flex space-x-4">
        <button onClick={onBack} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
          Back
        </button>
        <button onClick={() => onNext({})} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Skip for Now
        </button>
      </div>
    </div>
  );
}

function ModulesStep({ onNext, onBack }: StepProps) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">Module selection step - TODO</p>
      <div className="flex space-x-4">
        <button onClick={onBack} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
          Back
        </button>
        <button onClick={() => onNext({})} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Next
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

