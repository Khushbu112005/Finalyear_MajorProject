import React from "react";
import Link from "next/link";
import { ShieldCheck, Scale, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs mt-auto">
      {/* Statutory Disclaimers Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
            <span className="font-bold">Official Statutory Notice:</span> CivicSphere AI provides grounded informational guidance based on published Acts, Regulations, and Government Portals. Information generated does not constitute formal legal counsel. For representation before judicial tribunals, please consult a qualified advocate or the Legal Aid Clinic.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-green-700 text-white flex items-center justify-center text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">
            CivicSphere AI © 2026
          </span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span>Verified Government & Legal Intelligence Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/legal/acts" className="hover:text-green-600 dark:hover:text-green-400 transition">
            Statutory Sources Registry
          </Link>
          <a
            href="https://www.indiacode.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition"
          >
            India Code <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.india.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition"
          >
            National Portal of India <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
