import React from 'react';
import { Menu, Bell, Shield, UserCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

export const Header = ({ onOpenSidebar }) => {
  const { user, role } = useAuth();

  const profilePath = role === 'LAWYER' ? '/lawyer/profile' : '/citizen/profile';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          <span>CivicSphere Legal Cloud</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <Badge variant={role || 'CITIZEN'} size="sm" withDot>
          {role === 'LAWYER' ? 'Legal Counsel' : 'Citizen Member'}
        </Badge>

        <div className="h-5 w-[1px] bg-slate-200" />

        {/* Profile Link */}
        <Link
          to={profilePath}
          className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
              {user?.name || 'My Profile'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">View details</p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
