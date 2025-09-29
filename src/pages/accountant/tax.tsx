import React from 'react';
import Head from 'next/head';
import AccountantLayout from '@/components/AccountantLayout';

export default function AccountantTax() {
  return (
    <AccountantLayout title="Tax Management">
      <Head>
        <title>Tax Management - StreamFlow Accountant</title>
        <meta name="description" content="Manage tax compliance and reporting" />
      </Head>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tax Management</h2>
          <p className="text-gray-600 mb-6">
            Comprehensive tax management and compliance system for all client tax obligations.
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
                    This comprehensive tax management system is currently being developed. 
                    It will include tax preparation, compliance tracking, and automated filing capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Income Tax</h3>
              <p className="text-sm text-gray-500 mt-2">Federal and state income tax management</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Sales Tax</h3>
              <p className="text-sm text-gray-500 mt-2">Multi-state sales tax compliance</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Payroll Tax</h3>
              <p className="text-sm text-gray-500 mt-2">Payroll tax calculations and filings</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">1099 Management</h3>
              <p className="text-sm text-gray-500 mt-2">Contractor tax form management</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Tax Calendar</h3>
              <p className="text-sm text-gray-500 mt-2">Important tax dates and deadlines</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Compliance Tracking</h3>
              <p className="text-sm text-gray-500 mt-2">Tax compliance status monitoring</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </AccountantLayout>
  );
}
