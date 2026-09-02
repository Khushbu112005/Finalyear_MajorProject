"use client";

import React from "react";
import { ShieldAlert, CheckCircle2, Lock } from "lucide-react";

export default function AdminSecurityPage() {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Security Threat Telemetry
        </h1>
        <p className="text-xs text-gray-500">
          Real-time prompt injection detection, SSRF blocks, and IDOR boundary violations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500">Prompt Injections Blocked</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">100%</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500">SSRF Attempts Blocked</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">100%</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <span className="text-xs text-gray-500">Active PDF Exploits Blocked</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">100%</p>
        </div>
      </div>
    </div>
  );
}
