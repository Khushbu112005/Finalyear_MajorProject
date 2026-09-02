"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Trash2,
  Calendar,
  Filter
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function CaseWorkspacePage() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Property & Land");
  const [priority, setPriority] = useState("MEDIUM");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const res = await api.cases.list();
      setCases(res.data || []);
      if (res.data?.length > 0 && !selectedCase) {
        setSelectedCase(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await api.cases.create({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location,
      });
      setShowModal(false);
      setTitle("");
      setDescription("");
      await loadCases();
      setSelectedCase(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Are you sure you want to delete this case?")) return;
    try {
      await api.cases.delete(caseId);
      setSelectedCase(null);
      await loadCases();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Case Workspace & IDOR Protection
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Civic Case Workspace
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Open New Case
        </button>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Active Cases ({cases.length})
          </h2>

          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedCase?.id === c.id
                  ? "bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 shadow-sm"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-teal-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                  {c.title}
                </h3>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-950 px-1.5 py-0.5 rounded">
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {c.description}
              </p>
              <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400">
                <span>{c.category}</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Case Workspace Details */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedCase.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>Category: {selectedCase.category}</span>
                    <span>•</span>
                    <span>Priority: {selectedCase.priority}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCase(selectedCase.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
                  title="Delete Case"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Description & Situation Summary
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedCase.description}
                </p>
              </div>

              {selectedCase.counsel_notes && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                    Counsel & Researcher Advisory Notes
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {selectedCase.counsel_notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
              Select a case from the list or open a new one to view its workspace.
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Open New Case
            </h2>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. RTI First Appeal for Delay in Pension Processing"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                >
                  <option value="Property & Land">Property & Land</option>
                  <option value="Consumer Rights">Consumer Rights</option>
                  <option value="Right to Information">Right to Information</option>
                  <option value="Labor & Employment">Labor & Employment</option>
                  <option value="General / Other">General / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description of Issue
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide background context and current status..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Save Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
