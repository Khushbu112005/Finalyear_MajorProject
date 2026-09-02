"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api-client";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.auth.me()
      .then((res) => setUser(res.data?.user || null))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-green-700 text-white flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Citizen Profile
        </h1>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400">Full Name</label>
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
            {user?.name || "Civic Citizen"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400">Email Address</label>
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
            {user?.email || "citizen@civicsphere.org"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400">Role & Access Tier</label>
          <span className="inline-block text-[11px] font-bold text-green-700 bg-green-100 dark:bg-green-950 px-2.5 py-0.5 rounded-full mt-1 uppercase">
            {user?.role || "CITIZEN"}
          </span>
        </div>
      </div>
    </div>
  );
}
