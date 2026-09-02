"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, ExternalLink, Search, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";

export default function SourcesExplorerPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      try {
        const resp = await api.knowledge.listSources();
        setSources(resp.data || []);
      } catch (err) {
        console.error("Failed to load sources:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSources();
  }, []);

  const filtered = sources.filter((s) =>
    (s.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.publisher || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Official Legal & Gazette Sources</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Explore authoritative primary statutes, official gazettes, and verified regulatory frameworks indexed in CivicSphere.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search verified acts, publications, or gazettes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Loading statutory sources...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-gray-500">No sources found matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((src) => (
            <div
              key={src.source_id || src.id}
              className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Gazette
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {src.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Publisher: {src.publisher || "Government of India"}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                  Jurisdiction: {src.jurisdiction || "IN"} • Type: {src.source_type || "PRIMARY_STATUTE"}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Version {src.version || 1}</span>
                {src.official_url && (
                  <a
                    href={src.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium hover:underline"
                  >
                    <span>View Official Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
