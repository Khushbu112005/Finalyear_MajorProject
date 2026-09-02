"use client";

import React, { useState } from "react";
import { 
  Scale, 
  Search, 
  ShieldAlert, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  BookOpen, 
  AlertTriangle,
  FileCheck,
  Send
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function LegalGuidancePage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basis: true,
    meaning: true,
    steps: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await api.legal.query({ query: query.trim(), jurisdiction: "IN" });
      setAnswer(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve legal guidance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Module Title Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Module A • Statutory Intelligence
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Legal Guidance Engine
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Receive 10-section structured legal guidance grounded in verified Central & State Acts.
        </p>
      </div>

      {/* Query Submission Box */}
      <form onSubmit={handleQuery} className="mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm focus-within:border-blue-600 transition">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
            Ask Your Legal Question in Plain Language
          </label>
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What is the statutory time limit for a Public Information Officer to reply to an RTI application under Section 7?"
            className="w-full bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
            <span className="text-[11px] text-gray-400">
              Jurisdiction: Indian Law (Central & State Gazettes)
            </span>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Grounding in Acts..." : "Analyze Guidance"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400 mb-8">
          {error}
        </div>
      )}

      {/* 10-Section Legal Answer Display */}
      {answer && (
        <div className="space-y-4">
          {/* Fail-Safe State Warning */}
          {answer.fail_safe_state === "INSUFFICIENT_EVIDENCE" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Insufficient Evidence in Official Knowledge Base</p>
                <p className="mt-0.5">
                  To prevent hallucination, CivicSphere AI has flagged this inquiry as lacking verified statutory records. Please consult a legal professional.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: What I Understood */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              1. Understanding of Query
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
              {answer.what_i_understood}
            </p>
          </div>

          {/* Section 2: Relevant Legal Basis */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => toggleSection("basis")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> 2. Relevant Legal Basis (Acts & Sections)
              </h3>
              {expandedSections.basis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.basis && (
              <ul className="mt-3 space-y-1.5 text-xs text-gray-800 dark:text-gray-200">
                {answer.relevant_legal_basis?.map((b: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 3 & 4: General Meaning & Application */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => toggleSection("meaning")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                3 & 4. Plain Meaning & Applicability
              </h3>
              {expandedSections.meaning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.meaning && (
              <div className="mt-3 space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">General Statutory Meaning:</h4>
                  <p>{answer.what_it_generally_means}</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">How It May Relate to Your Case:</h4>
                  <p>{answer.how_it_may_relate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: What You May Consider Doing */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => toggleSection("steps")}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" /> 5. Recommended Next Steps
              </h3>
              {expandedSections.steps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.steps && (
              <div className="mt-3 space-y-2">
                {answer.what_you_may_consider_doing?.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-gray-800 dark:text-gray-200">
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {i + 1}
                    </span>
                    <p className="leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6 & 7: Evidence & Authorities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                6. Evidence That May Help
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                {answer.evidence_that_may_help?.map((item: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                7. Where to Go / Competent Desks
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                {answer.where_to_go?.map((place: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {place}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 8: Verified Sources & Citations */}
          {answer.sources && answer.sources.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                8. Verified Official Citations ({answer.sources.length})
              </h4>
              <div className="space-y-2">
                {answer.sources.map((src: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                    <div className="text-xs">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {src.source_id} {src.section ? `• Section ${src.section}` : ""}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-[11px] line-clamp-1 mt-0.5">
                        "{src.passage}"
                      </p>
                    </div>
                    {src.official_url && (
                      <a
                        href={src.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                      >
                        Official Gazette <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 9 & 10: Warnings & Disclaimer */}
          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>9. Procedural Warnings:</span>
              <span className="font-normal">{answer.warnings?.join(", ")}</span>
            </div>
            <p className="text-[11px] leading-relaxed italic border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-bold">10. Statutory Limitation:</span> {answer.important_limitation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
