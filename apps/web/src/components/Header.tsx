"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Scale, 
  Search, 
  Globe, 
  Moon, 
  Sun, 
  LogOut,
  Menu,
  X,
  BookOpen,
  Landmark,
  FileText,
  Network,
  Briefcase,
  Bot,
  Sliders
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";

const NAV_LINKS = [
  { name: "Legal Guidance", href: "/legal", icon: BookOpen },
  { name: "Statutory Registry", href: "/legal/acts", icon: Scale },
  { name: "Government Navigator", href: "/government", icon: Landmark },
  { name: "Document AI", href: "/documents", icon: FileText },
  { name: "Knowledge & Graph", href: "/knowledge", icon: Network },
  { name: "Case Workspace", href: "/cases", icon: Briefcase },
  { name: "AI Assistant", href: "/agents", icon: Bot },
  { name: "Admin Center", href: "/admin", icon: Sliders },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<"EN" | "HI">("EN");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile drawer on route change
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    api.auth.me()
      .then((res) => setUser(res.data?.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      router.push("/auth/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Emblem Accent */}
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

        {/* Global Search Bar (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
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
            <span className="hidden sm:inline">{lang === "EN" ? "English" : "हिंदी"}</span>
            <span className="sm:hidden">{lang}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth State (Desktop) */}
          <div className="hidden sm:flex items-center">
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-2.5 py-1 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition"
                >
                  <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold">
                      {user.role}
                    </p>
                  </div>
                </Link>
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

          {/* Mobile Drawer Trigger (LIVE-012) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-green-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer (LIVE-012) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* User state banner on mobile */}
          {user ? (
            <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900">
              <Link href="/profile" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-green-700 dark:text-green-400 uppercase font-semibold">{user.role}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <Link
                href="/auth/login"
                className="flex-1 text-center py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="flex-1 text-center py-2 text-xs font-bold text-white bg-green-700 rounded-xl shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Navigation Links List */}
          <nav className="space-y-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-green-700 text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-green-600 dark:text-green-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
