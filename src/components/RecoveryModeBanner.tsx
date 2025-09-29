// src/components/RecoveryModeBanner.tsx

/**
 * Recovery Mode Banner Component
 * 
 * Displays a prominent warning banner when the provider portal is operating
 * in recovery mode (break-glass authentication due to database unavailability).
 * 
 * Features:
 * - Prominent visual warning with red/orange styling
 * - Clear explanation of limited functionality
 * - System status indicators
 * - Auto-refresh capability to detect when normal mode is restored
 */

import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface RecoveryModeBannerProps {
  isRecoveryMode: boolean;
  onRefresh?: () => void;
  className?: string;
}

export default function RecoveryModeBanner({ 
  isRecoveryMode, 
  onRefresh,
  className = '' 
}: RecoveryModeBannerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Auto-refresh every 30 seconds to check if normal mode is restored
  useEffect(() => {
    if (!isRecoveryMode) return;

    const interval = setInterval(() => {
      setLastChecked(new Date());
      if (onRefresh) {
        onRefresh();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isRecoveryMode, onRefresh]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setLastChecked(new Date());
    
    if (onRefresh) {
      await onRefresh();
    }
    
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!isRecoveryMode) {
    return null;
  }

  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon 
            className="h-6 w-6 text-red-400 animate-pulse" 
            aria-hidden="true" 
          />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-800">
              🚨 Recovery Mode Active
            </h3>
            
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <ArrowPathIcon 
                className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
              {isRefreshing ? 'Checking...' : 'Check Status'}
            </button>
          </div>
          
          <div className="mt-2 text-sm text-red-700">
            <p className="font-medium mb-2">
              The provider portal is operating in emergency recovery mode due to database connectivity issues.
            </p>
            
            <div className="bg-red-100 rounded-md p-3 mb-3">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Limited Functionality Available:</h4>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                <li>System health monitoring and diagnostics</li>
                <li>Emergency configuration changes</li>
                <li>Log viewing and analysis</li>
                <li>Basic operational controls</li>
              </ul>
            </div>
            
            <div className="bg-red-100 rounded-md p-3 mb-3">
              <h4 className="font-semibold text-red-800 mb-2">🚫 Disabled Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                <li>Client data access and modifications</li>
                <li>Billing operations and invoice generation</li>
                <li>AI processing and lead scoring</li>
                <li>User account management</li>
                <li>Analytics and reporting</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-between text-xs text-red-600 mt-3">
              <span>
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
              <span className="flex items-center">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                Auto-refresh every 30s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recovery Mode Status Card
 * Shows detailed system status information in recovery mode
 */
interface RecoveryModeStatusProps {
  systemStatus: {
    database: 'unavailable' | 'degraded' | 'healthy';
    api: 'limited' | 'healthy';
    authentication: 'recovery' | 'normal';
    lastHealthCheck: Date;
  };
  className?: string;
}

export function RecoveryModeStatus({ systemStatus, className = '' }: RecoveryModeStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': case 'recovery': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': case 'limited': return '⚠️';
      case 'unavailable': case 'recovery': return '🚫';
      default: return '❓';
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔍 System Status Overview
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Database</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.database)}`}>
              {getStatusIcon(systemStatus.database)} {systemStatus.database}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">API Services</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.api)}`}>
              {getStatusIcon(systemStatus.api)} {systemStatus.api}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Authentication</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.authentication)}`}>
              {getStatusIcon(systemStatus.authentication)} {systemStatus.authentication}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Last Health Check</span>
            <span className="text-xs text-gray-500">
              {systemStatus.lastHealthCheck.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Recovery Mode:</strong> The system is operating with limited functionality. 
          Normal operations will resume automatically when database connectivity is restored.
        </p>
      </div>
    </div>
  );
}

/**
 * Recovery Mode Action Panel
 * Provides safe operational controls available in recovery mode
 */
interface RecoveryModeActionsProps {
  onHealthCheck: () => Promise<void>;
  onViewLogs: () => void;
  onEmergencyConfig: () => void;
  className?: string;
}

export function RecoveryModeActions({ 
  onHealthCheck, 
  onViewLogs, 
  onEmergencyConfig,
  className = '' 
}: RecoveryModeActionsProps) {
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

  const handleHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    try {
      await onHealthCheck();
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🛠️ Available Actions
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleHealthCheck}
          disabled={isRunningHealthCheck}
          className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
          {isRunningHealthCheck ? 'Running...' : 'Health Check'}
        </button>
        
        <button
          onClick={onViewLogs}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          📋 View Logs
        </button>
        
        <button
          onClick={onEmergencyConfig}
          className="inline-flex items-center justify-center px-4 py-2 border border-orange-300 shadow-sm text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          ⚙️ Emergency Config
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Note:</strong> Only essential operational controls are available in recovery mode. 
          All actions are logged and audited.
        </p>
      </div>
    </div>
  );
}
