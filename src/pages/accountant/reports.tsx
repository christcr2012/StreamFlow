import React from 'react';
import Head from 'next/head';
import AccountantLayout from '@/components/AccountantLayout';

export default function AccountantReports() {
  return (
    <AccountantLayout title="Financial Reports">
      <Head>
        <title>Financial Reports - StreamFlow Accountant</title>
        <meta name="description" content="Generate and manage financial reports" />
      </Head>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Reports</h2>
          <p className="text-gray-600 mb-6">
            Comprehensive financial reporting suite for accounting analysis and compliance.
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
                    This comprehensive financial reporting system is currently being developed. 
                    It will include P&L statements, balance sheets, cash flow reports, and custom analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">P&L Reports</h3>
              <p className="text-sm text-gray-500 mt-2">Profit & Loss Statements</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Balance Sheets</h3>
              <p className="text-sm text-gray-500 mt-2">Financial Position Reports</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Cash Flow</h3>
              <p className="text-sm text-gray-500 mt-2">Cash Flow Statements</p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800" disabled>
                Coming Soon
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900">Tax Reports</h3>
              <p className="text-sm text-gray-500 mt-2">Tax Compliance Reports</p>
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
