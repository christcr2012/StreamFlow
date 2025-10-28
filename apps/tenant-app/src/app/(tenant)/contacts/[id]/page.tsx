/**
 * Contact Detail Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  Customer: {
    id: string;
    company: string;
  };
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // TODO Phase 2: Implement useSWR data fetching from /api/v2/contacts/[id]
  // TODO Phase 2: Add edit form with validation
  // TODO Phase 2: Add delete functionality
  // TODO Phase 2: Load communication history (emails, calls, meetings)
  // TODO Phase 2: Load associated opportunities
  // TODO Phase 2: Add quick action buttons (call, email, schedule meeting)

  useEffect(() => {
    // Placeholder for data loading
    setLoading(false);
  }, [contactId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Contact not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => window.history.back()}
            className="mb-2 text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Contacts
          </button>
          <h1 className="text-3xl font-bold">{contact.name}</h1>
          <p className="text-gray-600">{contact.Customer.company}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={() => {
              // TODO Phase 2: Show delete confirmation
            }}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Contact Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Contact Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contact.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contact.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contact.role || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Primary Contact
              </dt>
              <dd className="mt-1">
                {contact.isPrimary ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                    Yes
                  </span>
                ) : (
                  <span className="text-sm text-gray-900">No</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(contact.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📧 Send Email
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📞 Log Call
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📅 Schedule Meeting
            </button>
            <button className="w-full rounded border border-gray-300 px-4 py-2 text-left hover:bg-gray-50">
              📝 Add Note
            </button>
          </div>
        </div>
      </div>

      {/* TODO Phase 2: Add Communication History section */}
      {/* TODO Phase 2: Add Associated Opportunities section */}
      {/* TODO Phase 2: Add Activity Timeline section */}
      {/* TODO Phase 2: Add Notes/Tasks section */}
    </div>
  );
}
