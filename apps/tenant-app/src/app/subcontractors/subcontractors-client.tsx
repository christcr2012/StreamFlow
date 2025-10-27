// apps/tenant-app/src/app/subcontractors/subcontractors-client.tsx
// Subcontractor management UI - Phase 1

'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  DollarSign,
  Phone,
  Mail,
  Briefcase,
} from 'lucide-react';

interface SubcontractorsClientProps {
  orgId: string;
}

interface Insurance {
  hasLiability: boolean;
  hasWorkersComp: boolean;
  expiresAt: string | null;
}

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  specialties: string[];
  status: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  insurance: Insurance;
  availability: string;
  onboardedAt: string;
  lastJobAt: string | null;
}

export function SubcontractorsClient({ orgId }: SubcontractorsClientProps) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubcontractors();
  }, [statusFilter, availabilityFilter]);

  async function fetchSubcontractors() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (availabilityFilter !== 'all') params.append('availability', availabilityFilter);

      const res = await fetch(`/api/subcontractors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubcontractors(data.subcontractors || []);
      }
    } catch (error) {
      console.error('Failed to fetch subcontractors:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSubcontractors = subcontractors.filter(
    (sub) =>
      sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusConfig = {
    active: { icon: CheckCircle2, color: 'green', label: 'Active' },
    pending: { icon: Clock, color: 'yellow', label: 'Pending' },
    inactive: { icon: XCircle, color: 'gray', label: 'Inactive' },
  };

  const availabilityConfig = {
    available: { color: 'green', label: 'Available' },
    busy: { color: 'yellow', label: 'Busy' },
    unavailable: { color: 'red', label: 'Unavailable' },
  };

  const activeCount = subcontractors.filter((s) => s.status === 'active').length;
  const avgRating =
    subcontractors.filter((s) => s.rating > 0).reduce((sum, s) => sum + s.rating, 0) /
      subcontractors.filter((s) => s.rating > 0).length || 0;
  const totalJobs = subcontractors.reduce((sum, s) => sum + s.completedJobs, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading subcontractors...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Subcontractors</h1>
              <p className="text-gray-600 mt-1">Manage your subcontractor network</p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Subcontractor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Total Subcontractors"
            value={subcontractors.length.toString()}
            icon={Users}
            color="blue"
          />
          <StatsCard
            label="Active"
            value={activeCount.toString()}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            label="Average Rating"
            value={avgRating.toFixed(1)}
            icon={Star}
            color="yellow"
          />
          <StatsCard
            label="Total Jobs"
            value={totalJobs.toString()}
            icon={Briefcase}
            color="purple"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by company, contact, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Subcontractors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubcontractors.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg border p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No subcontractors found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or add a new subcontractor
              </p>
            </div>
          ) : (
            filteredSubcontractors.map((sub) => {
              const statusConf = statusConfig[sub.status as keyof typeof statusConfig];
              const availConf = availabilityConfig[sub.availability as keyof typeof availabilityConfig];
              const StatusIcon = statusConf?.icon || Users;
              
              const insuranceExpired = sub.insurance.expiresAt && 
                new Date(sub.insurance.expiresAt) < new Date();

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-lg border hover:border-gray-300 transition-colors"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {sub.companyName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                              ${statusConf?.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                              ${statusConf?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${statusConf?.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                            `}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConf?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{sub.contactName}</p>
                      </div>
                      
                      {/* Availability Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold
                          ${availConf?.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                          ${availConf?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${availConf?.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                        `}
                      >
                        {availConf?.label}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {sub.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {sub.phone}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {sub.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-semibold">
                            {sub.rating > 0 ? sub.rating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Briefcase className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            {sub.completedJobs}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Jobs</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            {sub.hourlyRate}/hr
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Rate</p>
                      </div>
                    </div>

                    {/* Insurance Status */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${insuranceExpired ? 'text-red-500' : 'text-green-500'}`} />
                          <span className="text-gray-700">Insurance</span>
                        </div>
                        <div className="flex gap-3">
                          <span
                            className={`text-xs ${
                              sub.insurance.hasLiability ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            Liability
                          </span>
                          <span
                            className={`text-xs ${
                              sub.insurance.hasWorkersComp ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            Workers Comp
                          </span>
                        </div>
                      </div>
                      {insuranceExpired && (
                        <p className="text-xs text-red-600 mt-1">
                          Insurance expired {new Date(sub.insurance.expiresAt!).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Phase 1 Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Phase 1: Stub Implementation</p>
              <p>
                Subcontractor directory showing example data. Add subcontractor form, job
                assignments, payment tracking, and onboarding workflows will be fully implemented
                in Phase 2.
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
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
