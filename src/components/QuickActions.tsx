// Quick Actions Component
// Premium action buttons for AI features with credit cost display

import { useState } from 'react';

interface QuickAction {
  id: string;
  name: string;
  description: string;
  creditCost: number;
  icon: string;
  enabled: boolean;
  bgColor: string;
  textColor: string;
}

interface QuickActionsProps {
  onAction: (actionId: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onAction, disabled = false }: QuickActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const actions: QuickAction[] = [
    {
      id: 'analyze_lead',
      name: 'Analyze Lead',
      description: 'AI quality assessment & strategy',
      creditCost: 200,
      icon: '🎯',
      enabled: true,
      bgColor: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white'
    },
    {
      id: 'rfp_strategy',
      name: 'RFP Strategy',
      description: 'Bidding intelligence & analysis',
      creditCost: 300,
      icon: '📊',
      enabled: true,
      bgColor: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white'
    },
    {
      id: 'pricing_intel',
      name: 'Pricing Intel',
      description: 'Market rates & recommendations',
      creditCost: 250,
      icon: '💰',
      enabled: true,
      bgColor: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white'
    },
    {
      id: 'generate_response',
      name: 'Generate Response',
      description: 'Professional email templates',
      creditCost: 150,
      icon: '✉️',
      enabled: true,
      bgColor: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-white'
    }
  ];

  const handleAction = async (actionId: string) => {
    if (disabled) return;
    
    setLoading(actionId);
    try {
      await onAction(actionId);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-500 to-gray-600"></div>
        <h3 className="text-lg font-semibold text-gray-900">AI Quick Actions</h3>
        {disabled && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
            Credits Exhausted
          </span>
        )}
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const isLoading = loading === action.id;
          const isDisabled = disabled || !action.enabled;
          
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isDisabled || isLoading}
              className={`
                relative p-4 rounded-xl text-left transition-all duration-200 
                ${isDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : `${action.bgColor} ${action.textColor} transform hover:scale-105 shadow-md hover:shadow-lg`
                }
                ${isLoading ? 'opacity-75' : ''}
              `}
            >
              {/* Icon and Content */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{action.icon}</span>
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${isDisabled 
                    ? 'bg-gray-300 text-gray-500' 
                    : 'bg-white/20 text-white'
                  }
                `}>
                  {action.creditCost} credits
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">{action.name}</h4>
                <p className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-white/80'}`}>
                  {action.description}
                </p>
              </div>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}

              {/* Status Badge */}
              {!isDisabled && !isLoading && (
                <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 bg-white/60 rounded-lg border border-white/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Credits are deducted only on successful completion</span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}