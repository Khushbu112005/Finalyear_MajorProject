"use client";

import React, { useEffect, useState } from "react";
import { Scale, ExternalLink, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api-client";
import type { LegalAct } from "@/lib/types";

export default function StatutoryActsPage() {
  const [acts, setActs] = useState<LegalAct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.legal.listActs()
      .then((res) => {
        if (active) {
          setActs(res.data || []);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : (err as { message?: string })?.message || "Failed to load statutory acts."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-700 text-white flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
            Module A • Statutory Sources Registry
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Verified Indian Statutory Acts
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
          Authoritative catalog of official Central Acts, Gazette Notifications, and statutory rules indexed in the CivicSphere Knowledge Subsystem.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading verified statutory sources...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-center">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {acts.map((act, idx) => (
            <div
              key={act.source_id || act.id || act.title || idx}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                    {act.source_type || "ACT"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {act.verification_status || "ACTIVE"}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                  {act.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Publisher: {act.publisher || "Official Gazette of India"}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Jurisdiction: {act.jurisdiction || "IN"}
                </span>
                {act.official_url ? (
                  <a
                    href={act.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-green-700 hover:text-green-800 dark:text-green-400 transition"
                  >
                    India Code <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
