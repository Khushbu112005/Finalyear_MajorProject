import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export const AccessDenied = ({ requiredRole }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'LAWYER' ? '/lawyer/dashboard' : '/citizen/dashboard';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 ring-8 ring-amber-50/50">
          <ShieldAlert className="h-8 w-8 stroke-[1.8]" />
        </div>

        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">
          403 Forbidden
        </span>

        <h1 className="text-2xl font-bold text-slate-900 font-heading">
          Access Restricted
        </h1>

        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          You do not have the required role permissions to view this resource.
          {requiredRole && (
            <span className="block mt-1 font-semibold text-slate-700">
              Required Clearance: {requiredRole}
            </span>
          )}
          {user && (
            <span className="block text-slate-400 mt-1">
              Your Current Role: <span className="font-semibold text-blue-600">{user.role}</span>
            </span>
          )}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={ArrowLeft}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>

          <Link to={user ? dashboardPath : '/'} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              leftIcon={Home}
              className="w-full"
            >
              {user ? 'My Dashboard' : 'Home Page'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
