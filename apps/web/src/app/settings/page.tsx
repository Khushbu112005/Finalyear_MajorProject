"use client";

import React, { useState } from "react";
import { Sliders, Moon, Globe, Shield } from "lucide-react";

export default function SettingsPage() {
  const [lang, setLang] = useState("EN");

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center">
          <Sliders className="w-4 h-4" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Preferences & Settings
        </h1>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Primary Language</h3>
            <p className="text-xs text-gray-500">Select language for legal guidance and schemes</p>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
          >
            <option value="EN">English</option>
            <option value="HI">हिंदी (Hindi)</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">High Contrast Accessibility</h3>
            <p className="text-xs text-gray-500">Enhances contrast ratios for WCAG 2.1 AA compliance</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
        </div>
      </div>
    </div>
  );
}
