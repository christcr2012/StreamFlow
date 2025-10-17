'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveTable } from '@/components/responsive-table';
import { Button } from '@cortiware/ui';
import { Input } from '@cortiware/ui';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@cortiware/ui';
import { Pagination } from '@/components/ui/pagination';
import { showToast } from '@/components/ui/toast';
import { PullToRefreshIndicator } from '@/components/pull-to-refresh-indicator';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useHapticFeedback, getHapticClasses } from '@/hooks/use-haptic-feedback';
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

export function JobsClient({ jobs: initialJobs }: JobsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState(initialJobs);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [useInfiniteScrollMode, setUseInfiniteScrollMode] = useState(false);
  const itemsPerPage = 20;

  // Haptic feedback
  const { triggerHaptic } = useHapticFeedback();

  // Pull-to-refresh
  const handleRefresh = async () => {
    triggerHaptic('medium');
    router.refresh();
  };

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: true,
  });

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
        job.Customer?.company?.toLowerCase().includes(query) ||
        job.Customer?.primaryName?.toLowerCase().includes(query);

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

  // Infinite scroll
  const infiniteScroll = useInfiniteScroll({
    items: filteredAndSortedJobs,
    itemsPerPage,
    enabled: useInfiniteScrollMode,
  });

  // Pagination (traditional)
  const totalPages = Math.ceil(filteredAndSortedJobs.length / itemsPerPage);
  const paginatedJobs = useMemo(() => {
    if (useInfiniteScrollMode) {
      return infiniteScroll.displayedItems;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedJobs.slice(startIndex, endIndex);
  }, [filteredAndSortedJobs, currentPage, itemsPerPage, useInfiniteScrollMode, infiniteScroll.displayedItems]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      triggerHaptic('heavy');
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      // Remove job from local state
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      triggerHaptic('success');
      showToast('Job deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting job:', error);
      triggerHaptic('error');
      showToast('Failed to delete job', 'error');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Job',
      render: (job: Job) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{job.title}</p>
          {job.Customer && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {job.Customer.company || job.Customer.primaryName}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (job: Job) => (
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
      label: 'Scheduled',
      render: (job: Job) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {job.scheduledAt
            ? new Date(job.scheduledAt).toLocaleDateString()
            : 'Not scheduled'}
        </span>
      ),
    },
    {
      key: 'completedAt',
      label: 'Completed',
      render: (job: Job) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {job.completedAt
            ? new Date(job.completedAt).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (job: Job) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
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
        j.Customer?.company || j.Customer?.primaryName || 'No customer',
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
    <>
      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullToRefresh.pullDistance}
        threshold={pullToRefresh.threshold}
        isRefreshing={pullToRefresh.isRefreshing}
        isPulling={pullToRefresh.isPulling}
      />

      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Jobs</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
                {filteredAndSortedJobs.length} of {jobs.length} jobs
                {selectedJobs.size > 0 && ` • ${selectedJobs.size} selected`}
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className={`flex-1 md:flex-none ${getHapticClasses('light')}`}

              >
                Export CSV
              </Button>
              <Link href="/jobs/new" className="flex-1 md:flex-none">
                <Button className={`w-full ${getHapticClasses('medium')}`}>+ New Job</Button>
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
                  onChange={(value) => setSearchQuery(value)}
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
          <div className="p-4">
            <ResponsiveTable
              data={paginatedJobs}
              columns={columns}
              keyExtractor={(job) => job.id}
              onRowClick={(job) => router.push(`/jobs/${job.id}`)}
              onDelete={(job) => handleDeleteJob(job.id)}
              deleteLabel="Delete Job"
              emptyMessage="No jobs found. Create your first job to get started."
            />
          </div>
          {!useInfiniteScrollMode && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={filteredAndSortedJobs.length}
              itemsPerPage={itemsPerPage}
            />
          )}
          {useInfiniteScrollMode && infiniteScroll.hasMore && (
            <div ref={infiniteScroll.observerTarget} className="p-4 text-center">
              {infiniteScroll.isLoading ? (
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading more...</span>
                </div>
              ) : (
                <button
                  onClick={infiniteScroll.loadMore}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
    </>
  );
}

