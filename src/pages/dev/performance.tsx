// src/pages/dev/performance.tsx

/**
 * ⚡ SYSTEM PERFORMANCE ANALYSIS
 * 
 * Comprehensive performance monitoring and optimization tools.
 * Identifies bottlenecks, analyzes database queries, and enhances system efficiency.
 * 
 * FEATURES:
 * - Real-time performance monitoring
 * - Database query analysis and optimization
 * - API response time tracking
 * - Memory usage monitoring
 * - Cache performance analysis
 * - Bundle size optimization
 * - Core Web Vitals tracking
 * - Performance recommendations
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DeveloperLayout from '@/components/DeveloperLayout';
import { 
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
  recommendation?: string;
}

interface DatabaseQuery {
  id: string;
  query: string;
  executionTime: number;
  frequency: number;
  table: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  optimization: string;
  impact: 'high' | 'medium' | 'low';
}

interface APIEndpoint {
  path: string;
  method: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  status: 'healthy' | 'slow' | 'error';
}

export default function PerformanceAnalysis() {
  const router = useRouter();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [slowQueries, setSlowQueries] = useState<DatabaseQuery[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setIsAnalyzing(true);
    
    // Simulate performance analysis
    setTimeout(() => {
      setPerformanceMetrics([
        {
          name: 'Page Load Time',
          value: 2.3,
          unit: 's',
          status: 'good',
          trend: 'down',
          description: 'Average time to load pages',
          recommendation: 'Consider implementing code splitting for further optimization'
        },
        {
          name: 'First Contentful Paint',
          value: 1.2,
          unit: 's',
          status: 'good',
          trend: 'stable',
          description: 'Time to first content render'
        },
        {
          name: 'Largest Contentful Paint',
          value: 2.8,
          unit: 's',
          status: 'warning',
          trend: 'up',
          description: 'Time to largest content render',
          recommendation: 'Optimize images and implement lazy loading'
        },
        {
          name: 'Cumulative Layout Shift',
          value: 0.15,
          unit: '',
          status: 'warning',
          trend: 'stable',
          description: 'Visual stability metric',
          recommendation: 'Add size attributes to images and reserve space for dynamic content'
        },
        {
          name: 'Database Response Time',
          value: 45,
          unit: 'ms',
          status: 'good',
          trend: 'down',
          description: 'Average database query time'
        },
        {
          name: 'Memory Usage',
          value: 68,
          unit: '%',
          status: 'warning',
          trend: 'up',
          description: 'Server memory utilization',
          recommendation: 'Consider implementing memory caching and cleanup routines'
        },
        {
          name: 'API Response Time',
          value: 180,
          unit: 'ms',
          status: 'good',
          trend: 'stable',
          description: 'Average API endpoint response time'
        },
        {
          name: 'Bundle Size',
          value: 2.1,
          unit: 'MB',
          status: 'warning',
          trend: 'up',
          description: 'JavaScript bundle size',
          recommendation: 'Implement tree shaking and remove unused dependencies'
        }
      ]);

      setSlowQueries([
        {
          id: '1',
          query: 'SELECT * FROM organizations WHERE name LIKE \'%search%\' ORDER BY createdAt DESC',
          executionTime: 1250,
          frequency: 45,
          table: 'organizations',
          type: 'SELECT',
          optimization: 'Add index on name column and implement full-text search',
          impact: 'high'
        },
        {
          id: '2',
          query: 'SELECT u.*, o.name FROM users u JOIN organizations o ON u.orgId = o.id',
          executionTime: 890,
          frequency: 120,
          table: 'users',
          type: 'SELECT',
          optimization: 'Add composite index on (orgId, id) and consider denormalization',
          impact: 'high'
        },
        {
          id: '3',
          query: 'UPDATE jobs SET status = \'completed\' WHERE assignedTo = ? AND status = \'in-progress\'',
          executionTime: 650,
          frequency: 25,
          table: 'jobs',
          type: 'UPDATE',
          optimization: 'Add index on (assignedTo, status) columns',
          impact: 'medium'
        },
        {
          id: '4',
          query: 'SELECT COUNT(*) FROM leads WHERE createdAt >= ? AND createdAt <= ?',
          executionTime: 420,
          frequency: 80,
          table: 'leads',
          type: 'SELECT',
          optimization: 'Add index on createdAt column',
          impact: 'medium'
        }
      ]);

      setApiEndpoints([
        {
          path: '/api/organizations',
          method: 'GET',
          avgResponseTime: 145,
          requestCount: 1250,
          errorRate: 0.2,
          status: 'healthy'
        },
        {
          path: '/api/users/me',
          method: 'GET',
          avgResponseTime: 85,
          requestCount: 2100,
          errorRate: 0.1,
          status: 'healthy'
        },
        {
          path: '/api/jobs',
          method: 'POST',
          avgResponseTime: 320,
          requestCount: 450,
          errorRate: 1.2,
          status: 'slow'
        },
        {
          path: '/api/leads/search',
          method: 'GET',
          avgResponseTime: 850,
          requestCount: 180,
          errorRate: 2.8,
          status: 'error'
        }
      ]);

      setIsAnalyzing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'healthy':
        return 'text-green-400 bg-green-500/20';
      case 'warning':
      case 'slow':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'critical':
      case 'error':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-400" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-green-400" />;
      default:
        return <div className="w-4 h-4 bg-slate-400 rounded-full"></div>;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 bg-red-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const optimizeQuery = async (queryId: string) => {
    // Simulate query optimization
    setSlowQueries(queries => 
      queries.map(query => 
        query.id === queryId 
          ? { ...query, executionTime: Math.round(query.executionTime * 0.3) }
          : query
      )
    );
  };

  return (
    <DeveloperLayout title="Performance Analysis" subtitle="System optimization and bottleneck identification">
      <div className="space-y-8">
        {/* Analysis Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={loadPerformanceData}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
            >
              <BoltIcon className="h-4 w-4" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
              <EyeIcon className="h-4 w-4" />
              <span>Real-time Monitor</span>
            </button>
          </div>
          <div className="text-slate-400 text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {metric.value}{metric.unit}
                </h3>
                <p className="text-sm text-slate-400">{metric.name}</p>
              </div>
              <p className="text-xs text-slate-500 mb-2">{metric.description}</p>
              {metric.recommendation && (
                <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                  <p className="text-yellow-400 text-xs">{metric.recommendation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Database Query Analysis */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Slow Database Queries</h2>
            <div className="flex items-center space-x-2">
              <CircleStackIcon className="h-5 w-5 text-green-400" />
              <span className="text-green-400 text-sm">{slowQueries.length} queries analyzed</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {slowQueries.map((query) => (
              <div key={query.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(query.impact)}`}>
                        {query.impact} impact
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {query.type}
                      </span>
                      <span className="text-slate-400 text-xs">{query.table}</span>
                    </div>
                    <code className="text-green-400 text-sm bg-slate-900/50 p-2 rounded block mb-2">
                      {query.query}
                    </code>
                    <p className="text-slate-300 text-sm">{query.optimization}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-red-400 font-semibold">{query.executionTime}ms</div>
                    <div className="text-slate-400 text-sm">{query.frequency} calls/hr</div>
                    <button
                      onClick={() => optimizeQuery(query.id)}
                      className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                    >
                      Optimize
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Performance */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">API Endpoint Performance</h2>
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="h-5 w-5 text-blue-400" />
              <span className="text-blue-400 text-sm">{apiEndpoints.length} endpoints monitored</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300">Endpoint</th>
                  <th className="text-left py-3 px-4 text-slate-300">Method</th>
                  <th className="text-left py-3 px-4 text-slate-300">Avg Response</th>
                  <th className="text-left py-3 px-4 text-slate-300">Requests</th>
                  <th className="text-left py-3 px-4 text-slate-300">Error Rate</th>
                  <th className="text-left py-3 px-4 text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((endpoint, index) => (
                  <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-4 px-4">
                      <code className="text-green-400 text-sm">{endpoint.path}</code>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">{endpoint.avgResponseTime}ms</td>
                    <td className="py-4 px-4 text-slate-300">{endpoint.requestCount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`${endpoint.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                        {endpoint.errorRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                        {endpoint.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Optimization Recommendations</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-400 mb-1">High Priority</h3>
                <p className="text-slate-300 text-sm mb-2">
                  Optimize database queries for organizations and users tables. These queries are executed frequently and have high impact on performance.
                </p>
                <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors">
                  Apply Optimization
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <ClockIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-400 mb-1">Medium Priority</h3>
                <p className="text-slate-300 text-sm mb-2">
                  Implement image optimization and lazy loading to improve Largest Contentful Paint scores.
                </p>
                <button className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors">
                  Configure
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-400 mb-1">Low Priority</h3>
                <p className="text-slate-300 text-sm mb-2">
                  Consider implementing service worker caching for static assets to improve repeat visit performance.
                </p>
                <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors">
                  Plan Implementation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
}
