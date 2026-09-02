"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderLock, 
  Scale, 
  Compass, 
  FileText, 
  Network, 
  Bot, 
  Plus, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  ArrowUpRight 
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function CitizenDashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const casesResp = await api.cases.list();
        setCases(casesResp.data || []);
      } catch (err) {
        console.error("Failed to load dashboard cases:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Citizen Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track active legal matters, procedural roadmaps, and verified civic document analysis.
          </p>
        </div>
        <Link
          href="/cases"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-2xl shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Case Workspace</span>
        </Link>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/legal"
          className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-green-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 flex items-center justify-between">
            Legal Guidance
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Get 10-section structured legal breakdown grounded in verified acts.
          </p>
        </Link>

        <Link
          href="/government"
          className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 flex items-center justify-between">
            Government Services
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Evaluate eligibility and navigate government schemes and portals.
          </p>
        </Link>

        <Link
          href="/documents"
          className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-purple-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-400 flex items-center justify-between">
            Document AI
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Scan notices, orders, and contracts with OCR and malware checks.
          </p>
        </Link>

        <Link
          href="/assistant"
          className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-amber-500/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 flex items-center justify-between">
            Specialist Agents
            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Interact with Legal, Government, and Citation Verification Agents.
          </p>
        </Link>
      </div>

      {/* Active Workspaces Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FolderLock className="w-5 h-5 text-green-700 dark:text-green-400" />
          <span>Active Case Workspaces</span>
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No active case workspaces found. Click "Open New Case Workspace" to begin.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {cases.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white">{c.title}</h4>
                  <p className="text-[11px] text-gray-500">{c.category} • Status: {c.status}</p>
                </div>
                <Link href="/cases" className="text-xs text-green-700 hover:underline">
                  View Workspace
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
