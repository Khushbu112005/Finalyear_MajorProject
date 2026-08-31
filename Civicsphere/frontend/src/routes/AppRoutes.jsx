import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';

// Citizen Pages
import CitizenDashboard from '../pages/citizen/CitizenDashboard';
import CitizenCases from '../pages/citizen/CitizenCases';
import CitizenDocuments from '../pages/citizen/CitizenDocuments';
import CitizenProfile from '../pages/citizen/CitizenProfile';
import CitizenSettings from '../pages/citizen/CitizenSettings';

// Lawyer Pages
import LawyerDashboard from '../pages/lawyer/LawyerDashboard';
import LawyerCases from '../pages/lawyer/LawyerCases';
import LawyerClients from '../pages/lawyer/LawyerClients';
import LawyerDocuments from '../pages/lawyer/LawyerDocuments';
import LawyerProfile from '../pages/lawyer/LawyerProfile';
import LawyerSettings from '../pages/lawyer/LawyerSettings';

// 404 Fallback
import EmptyState from '../components/common/EmptyState';
import { Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Citizen Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/citizen/cases" element={<CitizenCases />} />
        <Route path="/citizen/documents" element={<CitizenDocuments />} />
        <Route path="/citizen/profile" element={<CitizenProfile />} />
        <Route path="/citizen/settings" element={<CitizenSettings />} />
      </Route>

      {/* Lawyer Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['LAWYER']} />}>
        <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
        <Route path="/lawyer/cases" element={<LawyerCases />} />
        <Route path="/lawyer/clients" element={<LawyerClients />} />
        <Route path="/lawyer/documents" element={<LawyerDocuments />} />
        <Route path="/lawyer/profile" element={<LawyerProfile />} />
        <Route path="/lawyer/settings" element={<LawyerSettings />} />
      </Route>

      {/* 404 Not Found Page */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-blue-50 text-blue-700 mb-4">
                <Scale className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 font-heading">
                404
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                Legal Jurisdiction Not Found
              </p>
              <p className="text-xs text-slate-500 mt-2">
                The requested URL route does not exist in the CivicSphere intelligence index.
              </p>
              <div className="mt-6 flex justify-center">
                <Link to="/">
                  <Button variant="primary" size="sm">
                    Return to Portal Gateway
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
