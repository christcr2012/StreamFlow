"use client";

import { useState } from "react";

// Phase 1 scaffold: Incidents list page
// TODO Phase 2: Implement useSWR data fetching from /api/incidents
// TODO Phase 2: Wire filters (status, severity, search)
// TODO Phase 2: Implement pagination (cursor-based)

interface IncidentListItem {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3";
  status: "OPEN" | "ACK" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignee?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  slaMinutes?: number; // remaining minutes
}

const mockRows: IncidentListItem[] = [];

export default function IncidentsPage() {
  const [rows] = useState<IncidentListItem[]>(mockRows);
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Incidents</h1>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          New Incident
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Search title/description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="w-full rounded border px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="ACK">ACK</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <select
          className="w-full rounded border px-3 py-2"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="P1">P1 - Critical</option>
          <option value="P2">P2 - High</option>
          <option value="P3">P3 - Medium</option>
        </select>
      </div>

      <div className="overflow-hidden rounded border">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Title
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Severity
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Assignee
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Created
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                Updated
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                SLA
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No incidents yet.
                </td>
              </tr>
            ) : (
              rows.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2">
                    <a
                      className="text-blue-600 hover:underline"
                      href={`/incidents/${it.id}`}
                    >
                      {it.title}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <SeverityBadge severity={it.severity} />
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                      {it.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{it.assignee ?? "—"}</td>
                  <td className="px-4 py-2">
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(it.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{formatSla(it.slaMinutes)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TODO Phase 2: Pagination controls */}
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: IncidentListItem["severity"];
}) {
  const map = {
    P1: "bg-red-100 text-red-700",
    P2: "bg-yellow-100 text-yellow-700",
    P3: "bg-blue-100 text-blue-700",
  } as const;
  return (
    <span
      className={`rounded px-2 py-1 text-xs font-semibold ${map[severity]}`}
    >
      {severity}
    </span>
  );
}

function formatSla(mins?: number) {
  if (mins === undefined || mins === null) return "—";
  const sign = mins < 0 ? "-" : "";
  const m = Math.abs(mins);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${sign}${h}h ${r}m`;
}
