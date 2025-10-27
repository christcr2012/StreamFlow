// apps/tenant-app/src/app/estimates/estimates-client.tsx
// Estimates list and management UI - Phase 1

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface EstimatesClientProps {
  orgId: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Estimate {
  id: string;
  publicId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  jobTitle: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string;
  createdAt: string;
  approvedAt?: string;
  declinedAt?: string;
  lineItems: LineItem[];
}

export function EstimatesClient({ orgId }: EstimatesClientProps) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchEstimates();
  }, [statusFilter]);

  async function fetchEstimates() {
    try {
      const res = await fetch(`/api/estimates?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setEstimates(data.estimates || []);
      }
    } catch (error) {
      console.error("Failed to fetch estimates:", error);
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "yellow",
      label: "Pending",
    },
    approved: {
      icon: CheckCircle2,
      color: "green",
      label: "Approved",
    },
    declined: {
      icon: XCircle,
      color: "red",
      label: "Declined",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading estimates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Estimates & Quotes
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage customer estimates
              </p>
            </div>
            <Link
              href="/estimates/new"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Estimate
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search estimates..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Total Estimates"
            value={estimates.length.toString()}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            label="Pending"
            value={estimates
              .filter((e) => e.status === "pending")
              .length.toString()}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            label="Approved"
            value={estimates
              .filter((e) => e.status === "approved")
              .length.toString()}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            label="Total Value"
            value={`$${estimates.reduce((sum, e) => sum + e.total, 0).toFixed(0)}`}
            icon={FileText}
            color="purple"
          />
        </div>

        {/* Estimates Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimate #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estimates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No estimates found</p>
                    <p className="text-sm mt-1">
                      Create your first estimate to get started
                    </p>
                  </td>
                </tr>
              ) : (
                estimates.map((estimate) => {
                  const config =
                    statusConfig[estimate.status as keyof typeof statusConfig];
                  const StatusIcon = config?.icon || FileText;

                  return (
                    <tr key={estimate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/estimates/${estimate.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {estimate.publicId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {estimate.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estimate.customerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {estimate.jobTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${config?.color === "yellow" ? "bg-yellow-100 text-yellow-800" : ""}
                            ${config?.color === "green" ? "bg-green-100 text-green-800" : ""}
                            ${config?.color === "red" ? "bg-red-100 text-red-800" : ""}
                          `}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config?.label || estimate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${estimate.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(estimate.validUntil).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-gray-600 hover:text-gray-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phase 2 Notice: blocked by real Estimates endpoints */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Phase 2: Stub Implementation</p>
              <p>
                Estimates page showing example data. Edit, send, and conversion
                to invoice features will be fully implemented in Phase 2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
