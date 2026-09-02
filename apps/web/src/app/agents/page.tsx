"use client";

import React, { useState } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Cpu, 
  User,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api-client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  stepsExecuted?: number;
  toolCalls?: any[];
}

export default function AgentChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Namaste! I am the CivicSphere Multi-Agent AI Assistant. I coordinate between Legal Guidance, Government Scheme Navigators, and Knowledge Graph specialists to answer your civic queries with grounded evidence. How can I assist you today?",
      agentName: "CivicSphereOrchestrator",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setLoading(true);

    try {
      const res = await api.agents.chat({ query: userQuery, jurisdiction: "IN" });
      const data = res.data;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "No response received from agent.",
          agentName: data.agent_name || "SpecialistAgent",
          stepsExecuted: data.steps_executed,
          toolCalls: data.tool_calls || [],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Agent execution notice: ${err.message || "Unable to reach specialist agents."}`,
          agentName: "System",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              CivicSphere Multi-Agent Assistant
            </h1>
            <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              Specialist Orchestration • 5-Step Bounded Reasoning Sandbox
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/60 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" /> Prompt Injection Protected
        </span>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                msg.role === "user"
                  ? "bg-gray-800"
                  : "bg-gradient-to-tr from-rose-600 to-pink-600 shadow-sm"
              }`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-green-700 text-white rounded-tr-none shadow-sm"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none shadow-sm"
              }`}
            >
              {msg.agentName && (
                <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  <span>{msg.agentName}</span>
                  {msg.stepsExecuted && (
                    <span className="text-gray-400 font-normal">
                      • {msg.stepsExecuted} reasoning step(s)
                    </span>
                  )}
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Tool Execution Details */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Tools Invoked ({msg.toolCalls.length}):
                  </p>
                  {msg.toolCalls.map((tc: any, tci: number) => (
                    <div
                      key={tci}
                      className="px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400 flex items-center justify-between"
                    >
                      <span className="font-mono">{tc.tool_name}</span>
                      <span className="text-green-600 font-semibold">{tc.execution_time_ms}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 pl-11">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px]">Specialist agents reasoning and exploring verified evidence...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="relative">
        <div className="flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-2 focus-within:border-rose-600 transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question across law, schemes, or documents..."
            className="w-full bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none px-3"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-md transition flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
