"use client";

import { useState } from "react";

// Phase 1 scaffold: Incident detail page
// TODO Phase 2: Implement useSWR data fetching from /api/incidents/[id]
// TODO Phase 2: Add status progression actions (ACK, START, RESOLVE, CLOSE)
// TODO Phase 2: Add activity timeline

interface IncidentDetail {
  id: string;
  title: string;
  description?: string;
  severity: "P1" | "P2" | "P3";
  status: "OPEN" | "ACK" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  slaMinutes?: number;
}

const emptyIncident: IncidentDetail = {
  id: "",
  title: "",
  severity: "P3",
  status: "OPEN",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function IncidentDetailPage() {
  const [incident] = useState<IncidentDetail>(emptyIncident);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Incident</h1>
        <div className="flex gap-2">
          {/* TODO Phase 2: Show context-aware actions based on status */}
          <button className="rounded bg-gray-100 px-3 py-2 text-sm">
            Acknowledge
          </button>
          <button className="rounded bg-gray-100 px-3 py-2 text-sm">
            Start Work
          </button>
          <button className="rounded bg-gray-100 px-3 py-2 text-sm">
            Resolve
          </button>
          <button className="rounded bg-gray-100 px-3 py-2 text-sm">
            Close
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded border p-4">
            <div className="mb-2 flex items-center gap-2">
              <SeverityBadge severity={incident.severity} />
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                {incident.status}
              </span>
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              {incident.title || "Untitled Incident"}
            </h2>
            <p className="whitespace-pre-wrap text-gray-700">
              {incident.description || "No description provided."}
            </p>
          </div>

          <div className="rounded border p-4">
            <h3 className="mb-3 text-lg font-semibold">Activity</h3>
            {/* TODO Phase 2: Render timeline of status changes, comments, assignments */}
            <p className="text-gray-500">No activity yet.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded border p-4">
            <h3 className="mb-3 text-lg font-semibold">Details</h3>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <dt className="text-gray-500">Assignee</dt>
              <dd className="col-span-2">
                {incident.assignee ?? "Unassigned"}
              </dd>
              <dt className="text-gray-500">Created</dt>
              <dd className="col-span-2">
                {new Date(incident.createdAt).toLocaleString()}
              </dd>
              <dt className="text-gray-500">Updated</dt>
              <dd className="col-span-2">
                {new Date(incident.updatedAt).toLocaleString()}
              </dd>
              <dt className="text-gray-500">SLA</dt>
              <dd className="col-span-2">{formatSla(incident.slaMinutes)}</dd>
            </dl>
          </div>

          <div className="rounded border p-4">
            <h3 className="mb-3 text-lg font-semibold">Assignment</h3>
            {/* TODO Phase 2: Implement assignment dropdown and save */}
            <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
              Assign to me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: IncidentDetail["severity"] }) {
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
