// src/pages/business/dashboard.tsx

/**
 * 🏢 BUSINESS OPERATING SYSTEM DASHBOARD
 * 
 * All-in-one business management platform with:
 * - Accounting integration (QuickBooks, ADP, Paychex)
 * - YNAB-style budgeting system
 * - Marketing automation
 * - AI-powered social media management
 * - Complete CRM functionality
 * - Financial planning and forecasting
 * - Business intelligence and analytics
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/AppShell';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  MegaphoneIcon,
  CogIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  BellIcon,
  SparklesIcon,
  GlobeAltIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface BusinessMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface FinancialSummary {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
}

interface CRMActivity {
  id: string;
  type: 'lead' | 'customer' | 'opportunity' | 'task';
  title: string;
  description: string;
  value?: number;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export default function BusinessDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [crmActivities, setCrmActivities] = useState<CRMActivity[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate business metrics
    setMetrics([
      {
        title: 'Monthly Revenue',
        value: '$47,250',
        change: '+12.5%',
        changeType: 'positive',
        icon: CurrencyDollarIcon,
        color: 'green',
        description: 'Total revenue this month'
      },
      {
        title: 'Active Customers',
        value: '342',
        change: '+18',
        changeType: 'positive',
        icon: UserGroupIcon,
        color: 'blue',
        description: 'Customers with active projects'
      },
      {
        title: 'Profit Margin',
        value: '28.4%',
        change: '+2.1%',
        changeType: 'positive',
        icon: TrendingUpIcon,
        color: 'purple',
        description: 'Net profit margin'
      },
      {
        title: 'Cash Flow',
        value: '$12,890',
        change: '-$2,100',
        changeType: 'negative',
        icon: BanknotesIcon,
        color: 'red',
        description: 'Current cash flow position'
      }
    ]);

    setFinancials({
      revenue: 47250,
      expenses: 33820,
      profit: 13430,
      cashFlow: 12890,
      accountsReceivable: 28500,
      accountsPayable: 15600
    });

    setCrmActivities([
      {
        id: '1',
        type: 'opportunity',
        title: 'Johnson Residence - HVAC Installation',
        description: 'Complete HVAC system replacement',
        value: 8500,
        priority: 'high',
        dueDate: '2024-01-25',
        status: 'in-progress'
      },
      {
        id: '2',
        type: 'lead',
        title: 'Downtown Office Complex',
        description: 'Commercial HVAC maintenance contract',
        value: 15000,
        priority: 'high',
        dueDate: '2024-01-28',
        status: 'pending'
      },
      {
        id: '3',
        type: 'task',
        title: 'Follow up with Smith Family',
        description: 'Schedule maintenance appointment',
        priority: 'medium',
        dueDate: '2024-01-24',
        status: 'pending'
      },
      {
        id: '4',
        type: 'customer',
        title: 'ABC Corporation - Quarterly Review',
        description: 'Review service performance and contract renewal',
        value: 25000,
        priority: 'medium',
        dueDate: '2024-01-30',
        status: 'pending'
      }
    ]);
  }, []);

  const getMetricColor = (color: string) => {
    const colorMap: Record<string, string> = {
      green: 'text-green-400 bg-green-500/20',
      blue: 'text-blue-400 bg-blue-500/20',
      purple: 'text-purple-400 bg-purple-500/20',
      red: 'text-red-400 bg-red-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/20'
    };
    return colorMap[color] || 'text-slate-400 bg-slate-500/20';
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-400 bg-green-500/20';
      case 'lead': return 'text-blue-400 bg-blue-500/20';
      case 'customer': return 'text-purple-400 bg-purple-500/20';
      case 'task': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                🏢 Business Operating System
              </h1>
              <p className="text-slate-400 mt-2">
                Complete business management and automation platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-lg border border-green-500/20 p-4">
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-green-300 font-mono text-sm">
                    {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getMetricColor(metric.color)}`}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    metric.changeType === 'positive' ? 'text-green-400' :
                    metric.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {metric.changeType === 'positive' ? (
                      <ArrowUpIcon className="h-4 w-4" />
                    ) : metric.changeType === 'negative' ? (
                      <ArrowDownIcon className="h-4 w-4" />
                    ) : null}
                    <span>{metric.change}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                  <p className="text-sm text-slate-400">{metric.title}</p>
                  <p className="text-xs text-slate-500 mt-2">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Overview and CRM Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Financial Overview */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Financial Overview</h2>
                <button 
                  onClick={() => router.push('/business/accounting')}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  View Details
                </button>
              </div>
              
              {financials && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300">Revenue</span>
                    </div>
                    <span className="text-green-400 font-semibold">
                      {formatCurrency(financials.revenue)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-slate-300">Expenses</span>
                    </div>
                    <span className="text-red-400 font-semibold">
                      {formatCurrency(financials.expenses)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-green-500/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-white font-medium">Net Profit</span>
                    </div>
                    <span className="text-blue-400 font-bold">
                      {formatCurrency(financials.profit)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-yellow-400 font-semibold">
                        {formatCurrency(financials.accountsReceivable)}
                      </div>
                      <div className="text-slate-400 text-sm">A/R</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-400 font-semibold">
                        {formatCurrency(financials.accountsPayable)}
                      </div>
                      <div className="text-slate-400 text-sm">A/P</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CRM Activities */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">CRM Activities</h2>
                <button 
                  onClick={() => router.push('/business/crm')}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {crmActivities.map((activity) => (
                  <div key={activity.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-sm">{activity.title}</h3>
                        <p className="text-slate-400 text-xs mt-1">{activity.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                          {activity.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-slate-400">
                        Due: {new Date(activity.dueDate).toLocaleDateString()}
                      </div>
                      {activity.value && (
                        <div className="text-green-400 font-medium">
                          {formatCurrency(activity.value)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => router.push('/business/accounting')}
              className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6 text-left hover:from-green-500/30 hover:to-green-600/30 transition-all duration-300 group"
            >
              <CurrencyDollarIcon className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Accounting</h3>
              <p className="text-slate-400 text-sm">QuickBooks, ADP, Paychex integration</p>
            </button>

            <button 
              onClick={() => router.push('/business/budgeting')}
              className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 text-left hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group"
            >
              <ChartBarIcon className="h-8 w-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Budgeting</h3>
              <p className="text-slate-400 text-sm">YNAB-style budget management</p>
            </button>

            <button 
              onClick={() => router.push('/business/marketing')}
              className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6 text-left hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 group"
            >
              <MegaphoneIcon className="h-8 w-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Marketing</h3>
              <p className="text-slate-400 text-sm">AI-powered automation & social media</p>
            </button>

            <button 
              onClick={() => router.push('/business/crm')}
              className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-2xl p-6 text-left hover:from-yellow-500/30 hover:to-yellow-600/30 transition-all duration-300 group"
            >
              <UserGroupIcon className="h-8 w-8 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">CRM</h3>
              <p className="text-slate-400 text-sm">Complete customer relationship management</p>
            </button>
          </div>

          {/* Business Intelligence */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Business Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">94%</div>
                <div className="text-slate-400">Customer Satisfaction</div>
                <div className="text-xs text-slate-500 mt-1">+2% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">67</div>
                <div className="text-slate-400">Active Projects</div>
                <div className="text-xs text-slate-500 mt-1">+12 new this month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">$125K</div>
                <div className="text-slate-400">Pipeline Value</div>
                <div className="text-xs text-slate-500 mt-1">+$23K this week</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
