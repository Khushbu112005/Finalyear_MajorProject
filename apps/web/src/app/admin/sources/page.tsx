"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    api.knowledge.listSources()
      .then((res) => setSources(res.data || []))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Official Statutory Sources Registry
        </h1>
        <p className="text-xs text-gray-500">
          Source provenance tracking across India Code and Official Gazettes.
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((src) => (
          <div
            key={src.source_id}
            className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between"
          >
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                {src.title}
              </h3>
              <p className="text-[11px] text-gray-500">
                {src.publisher} • Jurisdiction: {src.jurisdiction}
              </p>
            </div>
            {src.official_url && (
              <a
                href={src.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                Gazette Link <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
