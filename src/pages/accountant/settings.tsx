import React from 'react';
import Head from 'next/head';
import AccountantLayout from '@/components/AccountantLayout';

export default function AccountantSettings() {
  return (
    <AccountantLayout title="System Settings">
      <Head>
        <title>System Settings - StreamFlow Accountant</title>
        <meta name="description" content="Configure accountant system settings" />
      </Head>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
          <p className="text-gray-600 mb-6">
            Configure accountant portal settings and preferences.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Feature Under Development
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This comprehensive settings management system is currently being developed. 
                    It will include user preferences, system configuration, and security settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Account Settings</h3>
              <p className="text-sm text-gray-500">Manage your accountant profile and preferences</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Security Settings</h3>
              <p className="text-sm text-gray-500">Configure authentication and access controls</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Integration Settings</h3>
              <p className="text-sm text-gray-500">Manage QuickBooks, Xero, and banking connections</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Notification Settings</h3>
              <p className="text-sm text-gray-500">Configure alerts and reporting preferences</p>
            </div>
          </div>
        </div>
      </div>
    </AccountantLayout>
  );
}
