import React from "react";
import { Lock, ShieldCheck, EyeOff } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-700 text-white flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-green-700">
            DPDP Act 2023 Compliant
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Privacy Policy & Citizen Data Rights
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Last updated: September 2026 • Strictly adhering to the Digital Personal Data Protection Act, 2023.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            1. Automatic PII Masking
          </h2>
          <p>
            CivicSphere AI implements an automated real-time PII filter. Any Aadhaar numbers, PAN cards, phone numbers, and email addresses submitted in inquiries or document uploads are sanitized and masked before being logged or forwarded to AI reasoning modules.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            2. Strict IDOR Isolation
          </h2>
          <p>
            All case files, consultation transcripts, and uploaded notices are tied directly to authenticated user UUIDs. No user or third-party entity can access another citizen's case records.
          </p>
        </div>
      </div>
    </div>
  );
}
