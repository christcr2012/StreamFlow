/**
 * Infrastructure Admin Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";

interface InfrastructureMetric {
  metricKey: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  timestamp: string;
}

export default function InfrastructurePage() {
  const [metrics, setMetrics] = useState<InfrastructureMetric[]>([]);

  // TODO Phase 2: Implement useSWR data fetching from /api/infrastructure/metrics
  // TODO Phase 2: Add real-time updates via WebSocket or polling
  // TODO Phase 2: Add alert configuration
  // TODO Phase 2: Add historical charts

  const mockMetrics: InfrastructureMetric[] = [
    {
      metricKey: "cpu_usage_percent",
      value: 45,
      unit: "%",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      metricKey: "memory_usage_mb",
      value: 2048,
      unit: "MB",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      metricKey: "db_connections_active",
      value: 15,
      unit: "connections",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      metricKey: "db_connections_idle",
      value: 85,
      unit: "connections",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      metricKey: "api_response_time_ms",
      value: 120,
      unit: "ms",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    {
      metricKey: "error_rate_percent",
      value: 0.5,
      unit: "%",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "critical":
        return "🚨";
      default:
        return "⚪";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Infrastructure Health</h1>

      {/* System Status Overview */}
      <div className="mb-8 rounded-lg border-2 border-green-200 bg-green-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-800">
              System Status: Healthy
            </h2>
            <p className="text-green-700">All systems operational</p>
          </div>
          <div className="text-6xl">✅</div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockMetrics.map((metric) => (
          <div
            key={metric.metricKey}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-500">
                {metric.metricKey.replace(/_/g, " ").toUpperCase()}
              </div>
              <div className="text-2xl">{getStatusIcon(metric.status)}</div>
            </div>
            <div className="mb-2 text-3xl font-bold">
              {metric.value.toLocaleString()}
              <span className="text-lg text-gray-500"> {metric.unit}</span>
            </div>
            <div>
              <span
                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(
                  metric.status,
                )}`}
              >
                {metric.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Limits */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Resource Limits</h2>
        <div className="space-y-4">
          {/* TODO Phase 2: Load from /api/infrastructure/limits */}
          <div className="rounded border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium">Max Database Connections</div>
              <div className="text-sm text-gray-500">100 / 200</div>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-1/2 rounded-full bg-blue-600"></div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium">Max API Requests per Hour</div>
              <div className="text-sm text-gray-500">450 / 1000</div>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-[45%] rounded-full bg-green-600"></div>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium">Storage Usage</div>
              <div className="text-sm text-gray-500">7.5 GB / 10 GB</div>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 w-[75%] rounded-full bg-yellow-600"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Alerts</h2>
        <div className="text-center text-gray-500 py-8">
          No recent alerts. All systems healthy.
        </div>
      </div>

      {/* TODO Phase 2: Add uptime percentage */}
      {/* TODO Phase 2: Add incident history */}
      {/* TODO Phase 2: Add cost tracking dashboard */}
      {/* TODO Phase 2: Add backup status */}
    </div>
  );
}
