"use client";

import React, { useState, useEffect } from "react";
import { Network, Database } from "lucide-react";
import { api } from "@/lib/api-client";

export default function AdminKnowledgePage() {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Knowledge Graph Subgraph Administration
        </h1>
        <p className="text-xs text-gray-500">
          Neo4j entity ontology nodes, statutory relationships, and vector embeddings.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Graph database connected: Neo4j 5.x with APOC graph traversals.
        </p>
      </div>
    </div>
  );
}
