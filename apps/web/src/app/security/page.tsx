import React from "react";
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Defense-in-Depth Architecture
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Security Architecture & Posture
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Zero trust, prompt injection defenses, SSRF blocking, and active document malware isolation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-xs uppercase">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Prompt Injection Defense
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            All user inputs pass through multi-layer injection heuristics and are encapsulated in structural &lt;data_boundary&gt; tags before LLM processing.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-xs uppercase">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> SSRF Link-Local Defense
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Outbound crawlers and URL validators block AWS/GCP metadata endpoints (169.254.169.254), loopback addresses, and private subnets.
          </p>
        </div>
      </div>
    </div>
  );
}
