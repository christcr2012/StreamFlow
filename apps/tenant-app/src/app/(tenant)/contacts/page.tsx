/**
 * Contacts List Page
 * Phase 1: Scaffold with TODO placeholders
 */

"use client";

import { useState } from "react";

interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isPrimary: boolean;
  createdAt: string;
  Customer: {
    id: string;
    company: string;
  };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // TODO Phase 2: Implement useSWR data fetching from /api/v2/contacts
  // TODO Phase 2: Add search functionality (debounced)
  // TODO Phase 2: Add pagination (cursor-based)
  // TODO Phase 2: Add filter by customer
  // TODO Phase 2: Add filter by primary/secondary
  // TODO Phase 2: Add sort options (name, email, created date)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => {
            // TODO Phase 2: Open create contact modal
          }}
        >
          Add Contact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-4 py-2"
        />
        {/* TODO Phase 2: Add customer filter dropdown */}
        {/* TODO Phase 2: Add primary/all filter toggle */}
      </div>

      {/* Contacts Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Primary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {contacts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No contacts found. Add your first contact to get started.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      onClick={() => {
                        // TODO Phase 2: Navigate to contact detail page
                        window.location.href = `/contacts/${contact.id}`;
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {contact.name}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {contact.Customer.company}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {contact.email || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {contact.phone || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {contact.role || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {contact.isPrimary && (
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        Primary
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        // TODO Phase 2: Open edit modal
                      }}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        // TODO Phase 2: Show delete confirmation dialog
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TODO Phase 2: Add pagination controls */}
      {/* TODO Phase 2: Add bulk actions (export, delete) */}
      {/* TODO Phase 2: Add contact creation/edit modal */}
      {/* TODO Phase 2: Add communication history for each contact */}
    </div>
  );
}
