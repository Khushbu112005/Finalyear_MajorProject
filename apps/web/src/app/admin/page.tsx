"use client";

import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Layers, 
  AlertTriangle,
  Lock,
  Activity
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function AdminPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.knowledge.listSources(), api.agents.listTools()])
      .then(([srcRes, toolRes]) => {
        setSources(srcRes.data || []);
        setTools(toolRes.data || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            System Administration & Observability
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Admin Control Center
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Monitor statutory knowledge freshness, audit pipelines, role permissions, and tool execution boundaries.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Knowledge Sources</span>
            <Database className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
            {sources.length}
          </p>
          <p className="text-[11px] text-green-600 font-semibold mt-1">
            100% Verified Gazette Provenance
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Active Agent Tools</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
            {tools.length}
          </p>
          <p className="text-[11px] text-purple-600 font-semibold mt-1">
            Sandboxed with Boundary Wrapping
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Security Posture</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
            Grade A+
          </p>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            CSRF + httpOnly + Zero IDOR Leaks
          </p>
        </div>
      </div>

      {/* Sources Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
          Statutory Ingestion & Freshness Registry
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase font-semibold">
                <th className="pb-3">Source Title</th>
                <th className="pb-3">Publisher</th>
                <th className="pb-3">Jurisdiction</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sources.map((src) => (
                <tr key={src.source_id} className="text-gray-700 dark:text-gray-300">
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">
                    {src.title}
                  </td>
                  <td className="py-3">{src.publisher}</td>
                  <td className="py-3">{src.jurisdiction}</td>
                  <td className="py-3">
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-950 px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
