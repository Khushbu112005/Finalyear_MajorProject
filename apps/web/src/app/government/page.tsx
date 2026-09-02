"use client";

import React, { useState, useEffect } from "react";
import { 
  Landmark, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Filter, 
  Clock, 
  FileText,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function GovernmentNavigatorPage() {
  const [problemText, setProblemText] = useState("");
  const [income, setIncome] = useState("");
  const [category, setCategory] = useState("General");
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    api.government.listServices()
      .then((res) => setServices(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setCatalogLoading(false));
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim()) return;
    setLoading(true);
    setEligibilityResult(null);

    try {
      const res = await api.government.analyze({
        problem_text: problemText.trim(),
        citizen_context: {
          annual_income: income ? parseFloat(income) : 200000,
          category,
        },
        jurisdiction: "IN",
      });
      setServices(res.data.services || []);
      if (res.data.services?.length > 0) {
        setSelectedService(res.data.services[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEligibility = async (service: any) => {
    try {
      const res = await api.government.checkEligibility({
        service_id: service.service_id,
        citizen_context: {
          annual_income: income ? parseFloat(income) : 200000,
          category,
        },
      });
      setEligibilityResult(res.data.eligibility);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Module B • Government Service Navigator
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Government Scheme & Service Navigator
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Describe your situation in plain language to discover eligible government benefits, portals, and step-by-step procedures.
        </p>
      </div>

      {/* Problem Input & Context Card */}
      <form onSubmit={handleAnalyze} className="mb-8 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          Describe Your Situation or Civic Need
        </label>
        <textarea
          rows={2}
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder="e.g. I am a small farmer with an annual income below ₹2,00,000 looking for crop financial assistance or free legal aid..."
          className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 mb-4"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Annual Household Income (₹)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">
              Social Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
            >
              <option value="General">General</option>
              <option value="EWS">Economically Weaker Section (EWS)</option>
              <option value="OBC">Other Backward Class (OBC)</option>
              <option value="SC">Scheduled Caste (SC)</option>
              <option value="ST">Scheduled Tribe (ST)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !problemText.trim()}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? "Matching Schemes..." : "Match Services"}
            </button>
          </div>
        </div>
      </form>

      {/* Main Catalog & Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
            <span>Verified Schemes ({services.length})</span>
          </h2>

          {catalogLoading && (
            <p className="text-xs text-gray-400">Loading verified government services catalog...</p>
          )}

          {services.map((svc) => (
            <div
              key={svc.service_id}
              onClick={() => {
                setSelectedService(svc);
                handleCheckEligibility(svc);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedService?.service_id === svc.service_id
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {svc.title}
                </h3>
                {svc.is_verified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {svc.description}
              </p>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-emerald-600" /> {svc.authority || "Ministry"}
                </span>
                {svc.sla_days && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {svc.sla_days} Days SLA
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Service Procedure Details & Eligibility */}
        <div className="lg:col-span-2">
          {selectedService ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedService.title}
                  </h2>
                  {selectedService.official_url && (
                    <a
                      href={selectedService.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Official Portal <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                  {selectedService.description}
                </p>
              </div>

              {/* Dynamic Eligibility Check Result */}
              {eligibilityResult && (
                <div className={`p-4 rounded-xl border ${
                  eligibilityResult.is_eligible
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {eligibilityResult.is_eligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>You appear ELIGIBLE for this scheme based on your context.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-600" />
                        <span>Potential eligibility restriction: {eligibilityResult.reasons?.join(", ") || "Criteria check required."}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Required Documents */}
              {selectedService.required_documents && selectedService.required_documents.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Required Documents & Proofs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedService.required_documents.map((doc: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Procedural Steps */}
              {selectedService.procedure_steps && selectedService.procedure_steps.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Application Steps & Procedure
                  </h3>
                  <div className="space-y-3">
                    {selectedService.procedure_steps.map((step: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {step.step_title || `Step ${i + 1}`}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {step.description || step}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
              Select a government service or scheme from the list to view eligibility details and procedures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
