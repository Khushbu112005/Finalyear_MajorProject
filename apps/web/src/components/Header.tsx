"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Scale, 
  Search, 
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  User as UserIcon, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api-client";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<"EN" | "HI">("EN");
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    api.auth.me()
      .then((res) => setUser(res.data?.user || null))
      .catch(() => setUser(null));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      window.location.href = "/auth/login";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & National Emblem Accent */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-green-900/20 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
                Civic<span className="text-green-600 dark:text-green-500">Sphere</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-1.5 py-0.5 rounded">
                AI
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5 font-medium">
              National Civic & Legal Intelligence
            </p>
          </div>
        </Link>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Indian Acts, sections, schemes, procedures..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-green-500 dark:focus:border-green-500 rounded-xl text-sm focus:outline-none focus:bg-white dark:focus:bg-gray-900 transition-all"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Toggle Language (English / हिंदी)"
          >
            <Globe className="w-3.5 h-3.5 text-green-600" />
            {lang === "EN" ? "English" : "हिंदी"}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-green-50 dark:bg-green-950/40 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
              <Link
                href="/auth/login"
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg shadow-sm transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
