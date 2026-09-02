"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  UploadCloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Landmark, 
  Scale,
  FileCheck
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function DocumentProcessingPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.documents.list();
      setDocuments(res.data || []);
      if (res.data?.length > 0 && !selectedDoc) {
        setSelectedDoc(res.data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const res = await api.documents.upload(file);
      setSelectedDoc(res.data);
      await loadDocuments();
    } catch (err: any) {
      setUploadError(err.message || "Document upload failed. Ensure file is a valid PDF under 10MB.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Module D • Intelligent Document AI
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Intelligent Document Processing
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Upload legal notices, orders, or civic filings for secure OCR extraction, active malware scanning, and automatic Knowledge Graph entity linking.
        </p>
      </div>

      {/* Drag & Drop Upload Card */}
      <div className="mb-8 p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 text-center transition-all">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Upload Legal or Civic Document
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
          PDF documents up to 10MB • Automatically scanned for embedded exploits & linked to Knowledge Graph
        </p>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition">
          <span>{uploading ? "Processing 7-Stage Pipeline..." : "Select PDF Document"}</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploadError && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 max-w-md mx-auto text-xs text-red-700 dark:text-red-400 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uploaded Documents List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Uploaded Documents ({documents.length})
          </h2>

          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedDoc?.id === doc.id
                  ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 shadow-sm"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-amber-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                    {doc.original_filename}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950 px-1.5 py-0.5 rounded">
                  {doc.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                {new Date(doc.created_at).toLocaleDateString()} • {(doc.file_size_bytes / 1024).toFixed(1)} KB
              </p>
            </div>
          ))}
        </div>

        {/* Selected Document Structured Intelligence */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedDoc.original_filename}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedDoc.status_message}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/60 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-4 h-4" /> Security Scanned
                </span>
              </div>

              {/* Extracted Intelligence Cards */}
              {selectedDoc.analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">Document Classification</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                        {selectedDoc.analysis.document_type || "Government Notice"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase">Issuing Authority</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-amber-600" />
                        {selectedDoc.analysis.authority || "Designated Public Authority"}
                      </p>
                    </div>
                  </div>

                  {/* Legal References */}
                  {selectedDoc.analysis.legal_references && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Referenced Acts & Statutory Sections
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoc.analysis.legal_references.map((ref: string, i: number) => (
                          <span
                            key={i}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Knowledge Graph Entities */}
                  {selectedDoc.analysis.knowledge_node_ids && (
                    <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                      <h3 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                        <FileCheck className="w-4 h-4 text-purple-600" />
                        Linked to Knowledge Graph
                      </h3>
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        This document is linked to {selectedDoc.analysis.knowledge_node_ids.length} statutory nodes in the knowledge graph for cross-case intelligence.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
              Upload a document or select an existing one from the list to view its structured analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
