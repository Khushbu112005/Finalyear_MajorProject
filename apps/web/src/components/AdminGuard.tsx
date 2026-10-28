"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert, LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.auth.me()
      .then((res) => {
        if (isMounted) {
          if (res?.data?.user) {
            setUser(res.data.user);
          } else {
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user && (user.role?.toUpperCase() === "ADMIN" || user.role?.toUpperCase() === "SYSTEM");

  if (!user || !isAdmin) {
    return (
      <div className="flex-1 max-w-lg mx-auto my-12 px-4">
        <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Administrator Access Restricted
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            The CivicSphere Admin Control Center requires verified platform administrator credentials.
            {!user ? " Please sign in with an authorized administrator account." : " Your current role does not have administrative privileges."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!user ? (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname || "/admin")}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <LogIn className="w-4 h-4" /> Admin Login
              </Link>
            ) : null}
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
