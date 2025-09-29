import React from 'react';
import Head from 'next/head';
import AccountantLayout from '@/components/AccountantLayout';

export default function AccountantClients() {
  return (
    <AccountantLayout title="Client Portfolio">
      <Head>
        <title>Client Portfolio - StreamFlow Accountant</title>
        <meta name="description" content="Manage client portfolio and relationships" />
      </Head>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Portfolio</h2>
          <p className="text-gray-600 mb-6">
            Comprehensive client management and portfolio overview for accounting services.
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
                    This comprehensive client portfolio management system is currently being developed. 
                    It will include client onboarding, health scoring, relationship management, and detailed financial profiles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Total Clients</h3>
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Active Accounts</h3>
              <p className="text-2xl font-bold text-blue-600">--</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Monthly Revenue</h3>
              <p className="text-2xl font-bold text-purple-600">--</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </AccountantLayout>
  );
}
