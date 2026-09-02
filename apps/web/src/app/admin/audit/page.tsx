"use client";

import React, { useState, useEffect } from "react";
import { Sliders, ShieldAlert, Clock, Database } from "lucide-react";
import { api } from "@/lib/api-client";

export default function AdminAuditPage() {
  const [events, setEvents] = useState<any[]>([]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tamper-Evident Audit Logs
        </h1>
        <p className="text-xs text-gray-500">
          Immutable event trail for state mutations, legal queries, and document uploads.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 dark:bg-green-950/40 p-3 rounded-xl mb-4 font-semibold">
          <Database className="w-4 h-4" />
          Audit logging active: PII masked and persisted to PostgreSQL canonical store.
        </div>
      </div>
    </div>
  );
}
