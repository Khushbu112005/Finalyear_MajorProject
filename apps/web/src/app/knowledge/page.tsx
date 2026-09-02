"use client";

import React, { useState, useEffect } from "react";
import { 
  Network, 
  Search, 
  BookOpen, 
  Share2, 
  ExternalLink, 
  Layers, 
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api-client";

export default function KnowledgeGraphPage() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [neighborhood, setNeighborhood] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.knowledge.listSources()
      .then((res) => setSources(res.data || []))
      .catch((e) => console.error(e));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.knowledge.search({ query: query.trim(), jurisdiction: "IN", top_k: 4 });
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExploreEntity = async (entityName: string) => {
    try {
      const res = await api.knowledge.getNeighborhood(entityName, 2);
      setNeighborhood(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Module C • Knowledge & Neo4j Graph Engine
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Knowledge & Graph Explorer
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Explore grounded relationships between Indian Acts, Sections, Authorities, Penalties, and Grievance Tribunals.
        </p>
      </div>

      {/* Hybrid Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-2 focus-within:border-purple-600 transition">
          <Search className="w-5 h-5 text-gray-400 ml-3 mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across RTI Act, DPDP Act, Consumer Protection Act, or specific sections..."
            className="w-full bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none px-2"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            {loading ? "Searching..." : "Hybrid Search"}
          </button>
        </div>
      </form>

      {/* Main Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verified Statutory Sources Catalog */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Verified Knowledge Sources ({sources.length})
          </h2>

          {sources.map((src) => (
            <div
              key={src.source_id}
              onClick={() => handleExploreEntity(src.title)}
              className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-400 cursor-pointer transition shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {src.title}
                </span>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-950 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Publisher: {src.publisher}
              </p>
              {src.official_url && (
                <a
                  href={src.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] font-bold text-purple-600 mt-2 hover:underline"
                >
                  Official Gazette <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Search Results & Graph Subgraph Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {searchResults ? (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Retrieved Evidence Items ({searchResults.items?.length || 0})
              </h2>

              {searchResults.items?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                      {item.source_title} {item.section_number ? `• Section ${item.section_number}` : ""}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Confidence: {(item.rerank_score * 100).toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.text}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                    <span className="text-gray-400">Chunk: {item.chunk_id}</span>
                    <button
                      onClick={() => handleExploreEntity(item.source_title)}
                      className="flex items-center gap-1 text-purple-600 font-bold hover:underline"
                    >
                      <Share2 className="w-3 h-3" /> Explore Graph Neighborhood
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
              Submit a search query or select a source from the list to explore evidence and graph connections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
