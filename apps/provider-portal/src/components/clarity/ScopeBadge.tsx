"use client";
import React from "react";

export type ScopeLevel = "provider" | "plan" | "tenant";

const COLORS: Record<ScopeLevel, string> = {
  provider: "bg-blue-600/15 text-blue-300 border-blue-600/40",
  plan: "bg-purple-600/15 text-purple-300 border-purple-600/40",
  tenant: "bg-emerald-600/15 text-emerald-300 border-emerald-600/40",
};

export function ScopeBadge({ level, label }: { level: ScopeLevel; label?: string }) {
  const color = COLORS[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      <span className="uppercase tracking-wide opacity-80">{level}</span>
      {label ? <span className="opacity-90">• {label}</span> : null}
    </span>
  );
}

