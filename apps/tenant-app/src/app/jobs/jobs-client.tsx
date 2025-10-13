'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  customer: {
    id: string;
    company: string | null;
    primaryName: string | null;
  } | null;
}

interface JobsClientProps {
  jobs: Job[];
}

export function JobsClient({ jobs }: JobsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(query) ||
      job.customer?.company?.toLowerCase().includes(query) ||
      job.customer?.primaryName?.toLowerCase().includes(query);
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<Job>[] = [
    {
      key: 'title',
      header: 'Job',
      sortable: true,
      render: (job) => (
        <div>
          <p className="font-medium text-gray-900">{job.title}</p>
          {job.customer && (
            <p className="text-sm text-gray-500">
              {job.customer.company || job.customer.primaryName}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (job) => (
        <Badge
          variant={
            job.status === 'completed' ? 'success' :
            job.status === 'in-progress' ? 'info' :
            job.status === 'cancelled' ? 'danger' : 'default'
          }
        >
          {job.status}
        </Badge>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      sortable: true,
      render: (job) => (
        <span className="text-sm text-gray-500">
          {job.scheduledAt
            ? new Date(job.scheduledAt).toLocaleDateString()
            : 'Not scheduled'}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      sortable: true,
      render: (job) => (
        <span className="text-sm text-gray-500">
          {job.completedAt
            ? new Date(job.completedAt).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (job) => (
        <span className="text-sm text-gray-500">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600 mt-1">Manage your service jobs</p>
          </div>
          <Link href="/jobs/new">
            <Button>+ New Job</Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="search"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              fullWidth
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(j => j.status === 'scheduled').length}
              </p>
              <p className="text-sm text-gray-600">Scheduled</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {jobs.filter(j => j.status === 'in-progress').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {jobs.length}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card padding="none">
          <DataTable
            data={filteredJobs}
            columns={columns}
            keyExtractor={(job) => job.id}
            onRowClick={(job) => router.push(`/jobs/${job.id}`)}
            emptyMessage="No jobs found. Create your first job to get started."
          />
        </Card>
      </div>
    </div>
  );
}

