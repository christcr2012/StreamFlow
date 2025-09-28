// src/pages/dev/monitor.tsx

/**
 * 🖥️ SYSTEM MONITOR - Developer Tools
 * 
 * Real-time system monitoring and performance metrics
 */

import React from 'react';
import DeveloperLayout from '@/components/DeveloperLayout';

export default function SystemMonitor() {
  return (
    <DeveloperLayout title="System Monitor">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">System Monitor</h2>
          <p className="text-gray-400">Real-time system performance and health monitoring</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <div className="bg-gray-700 rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">System Health</h3>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">CPU Usage</span>
                <span className="text-green-400">23%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Memory</span>
                <span className="text-green-400">1.2GB / 4GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Disk Space</span>
                <span className="text-green-400">45GB / 100GB</span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-gray-700 rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">Database</h3>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Connections</span>
                <span className="text-green-400">12 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Query Time</span>
                <span className="text-green-400">45ms avg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Cache Hit</span>
                <span className="text-green-400">94.2%</span>
              </div>
            </div>
          </div>

          {/* API Performance */}
          <div className="bg-gray-700 rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">API Performance</h3>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Requests/min</span>
                <span className="text-green-400">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Avg Response</span>
                <span className="text-green-400">89ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Error Rate</span>
                <span className="text-green-400">0.02%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Recent System Activity</h3>
          <div className="bg-gray-700 rounded-lg border border-green-500/20">
            <div className="p-4 space-y-3">
              {[
                { time: '14:32:15', event: 'Database backup completed', status: 'success' },
                { time: '14:28:42', event: 'API rate limit adjusted', status: 'info' },
                { time: '14:25:18', event: 'Cache cleared for /api/leads', status: 'info' },
                { time: '14:22:03', event: 'SSL certificate renewed', status: 'success' },
                { time: '14:18:47', event: 'Memory usage spike detected', status: 'warning' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-600 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-400' :
                      activity.status === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}></div>
                    <span className="text-gray-300">{activity.event}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DeveloperLayout>
  );
}
