'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@cortiware/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@cortiware/ui';
import { Timeline } from '@/components/ui/timeline';
import { Select } from '@/components/ui/select';
import { JobPhotoGallery } from '@/components/job-photo-gallery';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  assignees: string[];
  location: any;
  notes: string | null;
  createdAt: Date;
  Customer: {
    id: string;
    company: string | null;
    primaryName: string | null;
  } | null;
  JobTimeline: Array<{
    id: string;
    eventType: string;
    description: string;
    createdAt: Date;
    metadata: any;
  }>;
  JobPhoto: Array<{
    id: string;
    url: string;
    caption: string | null;
    createdAt: Date;
  }>;
}

interface JobDetailClientProps {
  job: Job;
}

export function JobDetailClient({ job }: JobDetailClientProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            {job.Customer && (
              <p className="text-gray-600 mt-1">
                {job.Customer.company || job.Customer.primaryName}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Badge
              variant={
                job.status === 'completed' ? 'success' :
                job.status === 'in-progress' ? 'info' :
                job.status === 'cancelled' ? 'danger' : 'default'
              }
              size="lg"
            >
              {job.status}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <Card>
              <CardHeader title="Job Details" />
              <div className="p-6 space-y-4">
                {job.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-gray-900 whitespace-pre-wrap mt-1">{job.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {job.scheduledAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Scheduled</p>
                      <p className="text-gray-900">
                        {new Date(job.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completed</p>
                      <p className="text-gray-900">
                        {new Date(job.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {job.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-gray-900">{job.location.address || 'Location set'}</p>
                  </div>
                )}
                {job.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{job.notes}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Photos */}
            <JobPhotoGallery
              jobId={job.id}
              initialPhotos={job.JobPhoto}
              onPhotosChange={() => router.refresh()}
            />

            {/* Activity Timeline */}
            <Card>
              <CardHeader title="Activity Timeline" />
              <div className="p-6">
                <Timeline
                  events={job.JobTimeline.map(t => ({
                    id: t.id,
                    eventType: t.eventType,
                    description: t.description,
                    timestamp: t.createdAt,
                    metadata: t.metadata,
                  }))}
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Status Update */}
            <Card>
              <CardHeader title="Update Status" />
              <div className="p-6 space-y-4">
                <Select
                  value={job.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  options={[
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                  fullWidth
                  disabled={isUpdatingStatus}
                />
                {isUpdatingStatus && (
                  <p className="text-sm text-gray-500">Updating...</p>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <div className="p-6 space-y-3">
                {job.Customer && (
                  <Link href={`/customers/${job.Customer.id}`}>
                    <Button variant="secondary" fullWidth>
                      View Customer
                    </Button>
                  </Link>
                )}
                <Link href={`/invoices/new?jobId=${job.id}`}>
                  <Button variant="secondary" fullWidth>
                    Create Invoice
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader title="Metadata" />
              <div className="p-6 space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Job ID</p>
                  <p className="text-gray-900 font-mono text-xs">{job.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-900">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {job.assignees.length > 0 && (
                  <div>
                    <p className="text-gray-500">Assignees</p>
                    <p className="text-gray-900">{job.assignees.length} assigned</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

