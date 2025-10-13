'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { showToast } from '@/components/ui/toast';
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
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const itemsPerPage = 20;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : '/jobs';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage, router]);

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs.filter((job) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.customer?.company?.toLowerCase().includes(query) ||
        job.customer?.primaryName?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'scheduledAt':
          aVal = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
          bVal = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [jobs, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / itemsPerPage);
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedJobs.slice(startIndex, endIndex);
  }, [filteredAndSortedJobs, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedJobs.size === 0) return;

    try {
      const promises = Array.from(selectedJobs).map(jobId =>
        fetch(`/api/jobs/${jobId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      await Promise.all(promises);
      showToast(`Updated ${selectedJobs.size} job(s) to ${newStatus}`, 'success');
      setSelectedJobs(new Set());
      router.refresh();
    } catch (error) {
      showToast('Failed to update jobs', 'error');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Title', 'Customer', 'Status', 'Scheduled', 'Completed', 'Created'],
      ...filteredAndSortedJobs.map(j => [
        j.title,
        j.customer?.company || j.customer?.primaryName || 'No customer',
        j.status,
        j.scheduledAt ? new Date(j.scheduledAt).toLocaleDateString() : '',
        j.completedAt ? new Date(j.completedAt).toLocaleDateString() : '',
        new Date(j.createdAt).toLocaleDateString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-gray-600 mt-1">
              {filteredAndSortedJobs.length} of {jobs.length} jobs
              {selectedJobs.size > 0 && ` • ${selectedJobs.size} selected`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Link href="/jobs/new">
              <Button>+ New Job</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="search"
                  placeholder="Search jobs by title or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                />
              </div>
              <Select
                label="Status"
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
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'createdAt', label: 'Date Created' },
                  { value: 'title', label: 'Title' },
                  { value: 'status', label: 'Status' },
                  { value: 'scheduledAt', label: 'Scheduled Date' },
                ]}
                fullWidth
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </Button>
              {selectedJobs.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('in-progress')}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('completed')}
                  >
                    Mark Completed
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('cancelled')}
                  >
                    Cancel Selected
                  </Button>
                </div>
              )}
            </div>
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
            data={paginatedJobs}
            columns={columns}
            keyExtractor={(job) => job.id}
            onRowClick={(job) => router.push(`/jobs/${job.id}`)}
            emptyMessage="No jobs found. Create your first job to get started."
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredAndSortedJobs.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

