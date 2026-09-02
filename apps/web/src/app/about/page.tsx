import React from "react";
import { Scale, Landmark, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="w-12 h-12 rounded-2xl bg-green-700 text-white mx-auto flex items-center justify-center shadow-md mb-4">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          About CivicSphere AI
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
          A public-interest civic intelligence technology initiative engineered to bridge the accessibility gap in Indian statutory law and citizen entitlements.
        </p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            Mission & Core Principles
          </h2>
          <p>
            CivicSphere AI is architected around a strict principle: <strong>Zero Hallucinations in Law</strong>. Every recommendation, procedural timeline, and legal interpretation is mathematically grounded against verified Central and State Gazettes using hybrid vector-graph retrieval.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" /> Statutory Grounding
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only authentic Acts published by India Code and Ministry Gazettes are indexed into our tamper-evident Knowledge Graph.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-blue-600" /> Citizen First
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Transforming complex legal jargon and multi-departmental bureaucratic silos into plain language next steps for every citizen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
