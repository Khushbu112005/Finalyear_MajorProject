"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Landmark, 
  FileText, 
  Network, 
  Briefcase, 
  Bot, 
  Sliders
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Legal Guidance", href: "/legal", icon: BookOpen },
  { name: "Government Navigator", href: "/government", icon: Landmark },
  { name: "Document AI", href: "/documents", icon: FileText },
  { name: "Knowledge & Graph", href: "/knowledge", icon: Network },
  { name: "Case Workspace", href: "/cases", icon: Briefcase },
  { name: "AI Assistant", href: "/agents", icon: Bot },
  { name: "Admin Center", href: "/admin", icon: Sliders },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
