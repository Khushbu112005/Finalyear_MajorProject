import React from "react";
import { Network, Database } from "lucide-react";

export default function AdminKnowledgePage() {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            Ontology & Schema Registry
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Knowledge Graph Subgraph Administration
        </h1>
        <p className="text-xs text-gray-500">
          Neo4j entity ontology nodes, statutory relationships, and vector embeddings.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl font-semibold">
          <Database className="w-4 h-4" />
          Graph database connected: Neo4j 5.x with APOC graph traversals.
        </div>
      </div>
    </div>
  );
}
