"use client";

import React from "react";
import { Bell, CheckCircle2, Clock } from "lucide-react";

export default function NotificationsPage() {
  const NOTIFICATIONS = [
    {
      id: "notif_1",
      title: "RTI Appeal Deadline Reminder",
      message: "The 30-day statutory response window for your RTI request expires in 4 days.",
      date: "2 hours ago",
      read: false,
    },
    {
      id: "notif_2",
      title: "Document Analysis Completed",
      message: "Your uploaded Consumer Notice was verified and linked to 3 Knowledge Graph nodes.",
      date: "1 day ago",
      read: true,
    }
  ];

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-700 text-white flex items-center justify-center">
          <Bell className="w-4 h-4" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications & Alerts
        </h1>
      </div>

      <div className="space-y-3">
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition ${
              !n.read
                ? "bg-green-50/60 dark:bg-green-950/30 border-green-300 dark:border-green-800"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                {n.title}
              </h3>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {n.date}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {n.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
