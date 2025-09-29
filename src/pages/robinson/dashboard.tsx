// src/pages/robinson/dashboard.tsx

/**
 * 🏢 ROBINSON SOLUTIONS EXECUTIVE DASHBOARD
 * 
 * Ultra-premium executive dashboard with medium metallic blue design.
 * Enterprise-grade business intelligence and performance monitoring.
 * 
 * FEATURES:
 * - Executive-level KPI monitoring
 * - Real-time business metrics
 * - Financial performance tracking
 * - Client portfolio overview
 * - Operational efficiency metrics
 * - Strategic planning insights
 */

import { useState, useEffect } from 'react';
import RobinsonPremiumLayout from '@/components/RobinsonPremiumLayout';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  description: string;
}

interface RecentActivity {
  id: string;
  type: 'client' | 'financial' | 'operational' | 'security';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function RobinsonDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate real-time metrics
    setMetrics([
      {
        title: 'Total Revenue',
        value: '$2.4M',
        change: '+12.5%',
        changeType: 'positive',
        icon: CurrencyDollarIcon,
        description: 'Monthly recurring revenue'
      },
      {
        title: 'Active Clients',
        value: '147',
        change: '+8',
        changeType: 'positive',
        icon: UserGroupIcon,
        description: 'Enterprise client accounts'
      },
      {
        title: 'System Performance',
        value: '99.8%',
        change: '+0.2%',
        changeType: 'positive',
        icon: ChartBarIcon,
        description: 'Platform uptime'
      },
      {
        title: 'Global Reach',
        value: '23',
        change: '+2',
        changeType: 'positive',
        icon: GlobeAltIcon,
        description: 'Countries served'
      }
    ]);

    setActivities([
      {
        id: '1',
        type: 'client',
        title: 'New Enterprise Client Onboarded',
        description: 'TechCorp Industries signed 3-year contract',
        timestamp: '2 minutes ago',
        status: 'success'
      },
      {
        id: '2',
        type: 'financial',
        title: 'Q4 Revenue Target Achieved',
        description: 'Exceeded quarterly target by 15%',
        timestamp: '1 hour ago',
        status: 'success'
      },
      {
        id: '3',
        type: 'operational',
        title: 'System Maintenance Scheduled',
        description: 'Planned maintenance window: 2:00 AM - 4:00 AM UTC',
        timestamp: '3 hours ago',
        status: 'info'
      },
      {
        id: '4',
        type: 'security',
        title: 'Security Audit Completed',
        description: 'Annual security assessment passed with excellence',
        timestamp: '6 hours ago',
        status: 'success'
      }
    ]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpIcon className="h-4 w-4 text-green-400" />;
      case 'negative':
        return <ArrowDownIcon className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <RobinsonPremiumLayout 
      title="Executive Dashboard" 
      subtitle="Real-time business intelligence and performance monitoring"
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl border border-blue-500/20 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Welcome to Robinson Solutions
              </h1>
              <p className="text-slate-400 mt-2">
                Enterprise Platform • {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-blue-300">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-sm text-slate-400">UTC Time</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <metric.icon className="h-6 w-6 text-blue-400" />
                </div>
                <div className={`flex items-center space-x-1 ${getChangeColor(metric.changeType)}`}>
                  {getChangeIcon(metric.changeType)}
                  <span className="text-sm font-medium">{metric.change}</span>
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

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Revenue Performance</h2>
              <div className="flex items-center space-x-2">
                <TrendingUpIcon className="h-5 w-5 text-green-400" />
                <span className="text-green-400 text-sm font-medium">+15.2%</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {[65, 78, 82, 95, 88, 92, 100, 85, 90, 96, 88, 94].map((height, index) => (
                <div key={index} className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-400/40 rounded-t-lg relative group">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 group-hover:from-blue-400 group-hover:to-blue-300"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded">
                    ${(height * 25).toLocaleString()}K
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-4">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>

          {/* Client Growth */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Client Growth</h2>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">147 Active</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Enterprise Clients</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-800 rounded-full h-2">
                    <div className="w-3/4 bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"></div>
                  </div>
                  <span className="text-white font-medium">89</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Mid-Market</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-800 rounded-full h-2">
                    <div className="w-2/3 bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"></div>
                  </div>
                  <span className="text-white font-medium">42</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Small Business</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-800 rounded-full h-2">
                    <div className="w-1/4 bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"></div>
                  </div>
                  <span className="text-white font-medium">16</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 bg-slate-800/30 rounded-lg border border-blue-500/10 hover:border-blue-500/20 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium">{activity.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{activity.description}</p>
                  <p className="text-slate-500 text-xs mt-2">{activity.timestamp}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.type === 'client' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'financial' ? 'bg-green-500/20 text-green-400' :
                    activity.type === 'operational' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 text-left hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-2">Client Management</h3>
            <p className="text-slate-400 text-sm">Manage client accounts and relationships</p>
          </button>

          <button className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6 text-left hover:from-green-500/30 hover:to-green-600/30 transition-all duration-300 group">
            <CurrencyDollarIcon className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-2">Financial Overview</h3>
            <p className="text-slate-400 text-sm">View revenue and financial metrics</p>
          </button>

          <button className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-6 text-left hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 group">
            <ChartBarIcon className="h-8 w-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-2">Analytics</h3>
            <p className="text-slate-400 text-sm">Deep dive into business intelligence</p>
          </button>
        </div>
      </div>
    </RobinsonPremiumLayout>
  );
}
