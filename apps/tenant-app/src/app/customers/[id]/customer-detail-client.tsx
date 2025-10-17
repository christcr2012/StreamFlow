'use client';

import { Card, CardHeader } from '@cortiware/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@cortiware/ui';
import Link from 'next/link';

interface Customer {
  id: string;
  company: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  CustomerContact: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    isPrimary: boolean;
  }>;
  Job: Array<{
    id: string;
    title: string;
    status: string;
    scheduledAt: Date | null;
    createdAt: Date;
  }>;
  Invoice: Array<{
    id: string;
    number: string | null;
    amount: any;
    status: string;
    issuedAt: Date;
  }>;
}

interface CustomerDetailClientProps {
  customer: Customer;
}

export function CustomerDetailClient({ customer }: CustomerDetailClientProps) {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/customers" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Customers
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.company || customer.primaryName || 'Unnamed Customer'}
            </h1>
            {customer.company && customer.primaryName && (
              <p className="text-gray-600 mt-1">{customer.primaryName}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">Edit</Button>
            <Link href={`/jobs/new?customerId=${customer.id}`}>
              <Button>+ New Job</Button>
            </Link>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader title="Contact Information" />
              <div className="p-6 space-y-4">
                {customer.primaryEmail && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{customer.primaryEmail}</p>
                  </div>
                )}
                {customer.primaryPhone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{customer.primaryPhone}</p>
                  </div>
                )}
                {customer.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
                {customer.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Contacts */}
            {customer.CustomerContact.length > 0 && (
              <Card>
                <CardHeader title="Additional Contacts" />
                <div className="divide-y divide-gray-200">
                  {customer.CustomerContact.map((contact) => (
                    <div key={contact.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          {contact.role && (
                            <p className="text-sm text-gray-500">{contact.role}</p>
                          )}
                        </div>
                        {contact.isPrimary && (
                          <Badge variant="info" size="sm">Primary</Badge>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {contact.email && <p>{contact.email}</p>}
                        {contact.phone && <p>{contact.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Jobs */}
            <Card>
              <CardHeader 
                title="Recent Jobs" 
                action={
                  <Link href={`/jobs/new?customerId=${customer.id}`}>
                    <Button size="sm">+ New Job</Button>
                  </Link>
                }
              />
              <div className="divide-y divide-gray-200">
                {customer.Job.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No jobs yet
                  </div>
                ) : (
                  customer.Job.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-500">
                            {job.scheduledAt
                              ? new Date(job.scheduledAt).toLocaleDateString()
                              : 'Not scheduled'}
                          </p>
                        </div>
                        <Badge variant={
                          job.status === 'completed' ? 'success' :
                          job.status === 'in-progress' ? 'info' :
                          job.status === 'cancelled' ? 'danger' : 'default'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Recent Invoices */}
            <Card>
              <CardHeader 
                title="Recent Invoices"
                action={
                  <Link href={`/invoices/new?customerId=${customer.id}`}>
                    <Button size="sm">+ New Invoice</Button>
                  </Link>
                }
              />
              <div className="divide-y divide-gray-200">
                {customer.Invoice.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No invoices yet
                  </div>
                ) : (
                  customer.Invoice.map((invoice) => (
                    <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 text-sm">{invoice.number || 'Draft'}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'open' ? 'warning' : 'default'
                        } size="sm">
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-500">
                          {new Date(invoice.issuedAt).toLocaleDateString()}
                        </p>
                        <p className="font-medium text-gray-900">
                          ${(Number(invoice.amount) / 100).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader title="Metadata" />
              <div className="p-6 space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Customer ID</p>
                  <p className="text-gray-900 font-mono">{customer.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

