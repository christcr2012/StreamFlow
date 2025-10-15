'use client';

import React from 'react';

/**
 * RFP Strategy Analysis Component
 * 
 * Displays AI-generated bidding strategy and recommendations
 */
export interface RFPStrategyProps {
  strategy: {
    competitiveLandscape: string;
    keyRequirements: string[];
    pricingStrategy: string;
    winFactors: string[];
    riskFactors: string[];
    responseTemplate: string;
  };
  confidence?: number;
  aiAnalysisFailed?: boolean;
  className?: string;
}

export function RFPStrategyDisplay({ strategy, confidence, aiAnalysisFailed, className = '' }: RFPStrategyProps) {
  if (aiAnalysisFailed) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              AI Analysis Unavailable
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              AI budget exhausted or service unavailable. Manual analysis required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Confidence Indicator */}
      {confidence !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">AI Confidence:</span>
          <div className="flex-1 max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence >= 0.8
                  ? 'bg-green-600 dark:bg-green-500'
                  : confidence >= 0.6
                  ? 'bg-yellow-600 dark:bg-yellow-500'
                  : 'bg-orange-600 dark:bg-orange-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      )}

      {/* Competitive Landscape */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>🏆</span>
          Competitive Landscape
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {strategy.competitiveLandscape}
        </p>
      </div>

      {/* Key Requirements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>📋</span>
          Key Requirements
        </h3>
        <ul className="space-y-2">
          {strategy.keyRequirements.map((req, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing Strategy */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>💰</span>
          Pricing Strategy
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {strategy.pricingStrategy}
        </p>
      </div>

      {/* Win Factors */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
          <span>🎯</span>
          Win Factors
        </h3>
        <ul className="space-y-2">
          {strategy.winFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
              <span className="text-green-600 dark:text-green-400 mt-0.5">+</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risk Factors */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
          <span>⚠️</span>
          Risk Factors
        </h3>
        <ul className="space-y-2">
          {strategy.riskFactors.map((risk, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
              <span className="text-red-600 dark:text-red-400 mt-0.5">!</span>
              <span>{risk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Response Template */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>📝</span>
          Response Template
        </h3>
        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded">
          {strategy.responseTemplate}
        </pre>
      </div>
    </div>
  );
}

/**
 * Pricing Advice Component
 * 
 * Displays AI-generated pricing recommendations
 */
export interface PricingAdviceProps {
  pricing: {
    suggestedRange: { min: number; max: number };
    priceJustification: string;
    competitiveFactors: string[];
    valueProposition: string;
    negotiationTips: string[];
  };
  confidence?: number;
  aiAnalysisFailed?: boolean;
  className?: string;
}

export function PricingAdviceDisplay({ pricing, confidence, aiAnalysisFailed, className = '' }: PricingAdviceProps) {
  if (aiAnalysisFailed) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              AI Pricing Analysis Unavailable
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              AI budget exhausted or service unavailable. Manual pricing analysis required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Confidence Indicator */}
      {confidence !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Pricing Confidence:</span>
          <div className="flex-1 max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence >= 0.8
                  ? 'bg-green-600 dark:bg-green-500'
                  : confidence >= 0.6
                  ? 'bg-yellow-600 dark:bg-yellow-500'
                  : 'bg-orange-600 dark:bg-orange-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      )}

      {/* Suggested Range */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <span>💵</span>
          Suggested Pricing Range
        </h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Minimum</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ${pricing.suggestedRange.min.toLocaleString()}
            </p>
          </div>
          <div className="text-4xl text-blue-600 dark:text-blue-400">→</div>
          <div className="text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Maximum</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ${pricing.suggestedRange.max.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Price Justification */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <span>📊</span>
          Price Justification
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {pricing.priceJustification}
        </p>
      </div>

      {/* Competitive Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🎯</span>
          Competitive Factors
        </h3>
        <ul className="space-y-2">
          {pricing.competitiveFactors.map((factor, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Value Proposition */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
          <span>✨</span>
          Value Proposition
        </h3>
        <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
          {pricing.valueProposition}
        </p>
      </div>

      {/* Negotiation Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>💡</span>
          Negotiation Tips
        </h3>
        <ul className="space-y-2">
          {pricing.negotiationTips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">{index + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Win Probability Indicator
 * 
 * Displays estimated win probability with visual indicator
 */
export interface WinProbabilityProps {
  probability: number; // 0-100
  confidence?: number; // 0-1
  className?: string;
}

export function WinProbabilityIndicator({ probability, confidence, className = '' }: WinProbabilityProps) {
  const getColor = () => {
    if (probability >= 70) return 'green';
    if (probability >= 40) return 'yellow';
    return 'red';
  };

  const getLabel = () => {
    if (probability >= 70) return 'HIGH';
    if (probability >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const color = getColor();
  const label = getLabel();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span>🎲</span>
        Win Probability
      </h3>
      
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(probability / 100) * 351.86} 351.86`}
              className={`${
                color === 'green'
                  ? 'text-green-600 dark:text-green-500'
                  : color === 'yellow'
                  ? 'text-yellow-600 dark:text-yellow-500'
                  : 'text-red-600 dark:text-red-500'
              } transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {probability}%
            </span>
            <span
              className={`text-xs font-semibold ${
                color === 'green'
                  ? 'text-green-600 dark:text-green-400'
                  : color === 'yellow'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {label}
            </span>
          </div>
        </div>
      </div>

      {confidence !== undefined && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Confidence: <span className="font-medium text-gray-900 dark:text-gray-100">{Math.round(confidence * 100)}%</span>
          </p>
        </div>
      )}
    </div>
  );
}

