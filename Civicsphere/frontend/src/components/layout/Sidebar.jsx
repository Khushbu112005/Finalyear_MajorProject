import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Settings,
  LogOut,
  Scale,
  Users,
  FolderGit2,
  UserCheck,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const citizenNavItems = [
    { label: 'Dashboard', path: '/citizen/dashboard', icon: LayoutDashboard },
    { label: 'My Cases', path: '/citizen/cases', icon: Briefcase },
    { label: 'My Documents', path: '/citizen/documents', icon: FileText },
    { label: 'Profile', path: '/citizen/profile', icon: User },
    { label: 'Settings', path: '/citizen/settings', icon: Settings },
  ];

  const lawyerNavItems = [
    { label: 'Dashboard', path: '/lawyer/dashboard', icon: LayoutDashboard },
    { label: 'Cases', path: '/lawyer/cases', icon: Scale },
    { label: 'Clients', path: '/lawyer/clients', icon: Users },
    { label: 'Documents', path: '/lawyer/documents', icon: FolderGit2 },
    { label: 'Profile', path: '/lawyer/profile', icon: UserCheck },
    { label: 'Settings', path: '/lawyer/settings', icon: Settings },
  ];

  const navItems = role === 'LAWYER' ? lawyerNavItems : citizenNavItems;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 transform bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand header */}
        <div>
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-700/20">
                <Scale className="h-5 w-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 font-heading">
                  CivicSphere
                </span>
                <span className="ml-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  AI
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User role summary badge */}
          <div className="px-5 py-3.5 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Portal Role
              </span>
              <Badge variant={role || 'CITIZEN'} size="xs" withDot>
                {role || 'CITIZEN'}
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom logout section */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
