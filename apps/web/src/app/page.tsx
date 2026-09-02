"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Scale, 
  Landmark, 
  FileText, 
  Network, 
  Briefcase, 
  Bot, 
  ShieldCheck, 
  Search, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/legal?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const MODULE_CARDS = [
    {
      title: "Legal Guidance Engine",
      badge: "Module A",
      description: "10-section structured legal guidance grounded on verified Central & State Acts with exact statutory citations.",
      href: "/legal",
      icon: Scale,
      color: "from-blue-600 to-indigo-700",
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Government Service Navigator",
      badge: "Module B",
      description: "Citizen scheme discovery, dynamic multi-parameter eligibility evaluation, and step-by-step procedural steps.",
      href: "/government",
      icon: Landmark,
      color: "from-emerald-600 to-green-700",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Document AI Processing",
      badge: "Module D",
      description: "Secure OCR analysis, active content malware scanning, evidence extraction, and automatic Knowledge Graph linking.",
      href: "/documents",
      icon: FileText,
      color: "from-amber-600 to-orange-700",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Knowledge & Graph Explorer",
      badge: "Module C",
      description: "Interactive Neo4j graph reasoning, hybrid multi-modal search, and tamper-proof statutory provenance.",
      href: "/knowledge",
      icon: Network,
      color: "from-purple-600 to-violet-700",
      accent: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Case Management Workspace",
      badge: "Module Cases",
      description: "Secure workspace with strict IDOR prevention, evidence attachment, timeline tracking, and counsel assistance.",
      href: "/cases",
      icon: Briefcase,
      color: "from-teal-600 to-cyan-700",
      accent: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Multi-Agent AI Assistant",
      badge: "Phase 6",
      description: "Autonomous reasoning coordination across specialized Legal, Government, and Knowledge agents with 5-step bounded execution.",
      href: "/agents",
      icon: Bot,
      color: "from-rose-600 to-pink-700",
      accent: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50/60 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-16 pb-20 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-xs font-bold text-green-800 dark:text-green-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            Evidence-Grounded National Civic Intelligence Architecture
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
            Empowering Citizens with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Verified Legal & Civic AI
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
            Instant statutory guidance, scheme eligibility checks, and secure document intelligence — strictly grounded on official Indian law without hallucinations.
          </p>

          {/* Direct Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-8">
            <div className="flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-green-900/10 border border-gray-200 dark:border-gray-700 p-2 focus-within:border-green-600 transition">
              <Search className="w-5 h-5 text-gray-400 ml-3 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask any civic or legal query (e.g. RTI Appeal timeline, Consumer claim)..."
                className="w-full bg-transparent text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none px-2"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold shadow-md transition"
              >
                Analyze <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Official Gazette Provenance
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-green-600" />
              IDOR & Privacy Protected
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Anti-Hallucination Fail-Safes
            </span>
          </div>
        </div>
      </section>

      {/* 6 Core Functional Modules Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Integrated Civic Modules
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Consolidated architecture built to the 97-Page CivicSphere Master Engineering Specification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex flex-col p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-500/50 dark:hover:border-green-500/50 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {card.title}
                </h3>

                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed flex-1">
                  {card.description}
                </p>

                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 group-hover:translate-x-1 transition-transform">
                  Launch Module <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
