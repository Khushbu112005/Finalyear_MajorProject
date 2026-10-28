"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
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
          <p className="text-xs text-gray-500 font-medium">Verifying authentication session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 max-w-lg mx-auto my-12 px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            This protected workspace requires an active, verified citizen or legal researcher account. Please sign in to access your saved cases and documents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname || "/")}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <LogIn className="w-4 h-4" /> Sign In to Continue
            </Link>
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
