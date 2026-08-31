import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated, role } = useAuth();
  const dashboardPath = role === 'LAWYER' ? '/lawyer/dashboard' : '/citizen/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 subtle-mesh-bg">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-700/20">
              <Scale className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 font-heading">
                CivicSphere
              </span>
              <span className="ml-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={dashboardPath}>
                <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                  Open My Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Next-Generation Civic & Legal Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-heading">
              Empowering Citizens & Legal Counsel with{' '}
              <span className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                Civic Clarity
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              CivicSphere AI bridges the gap between public legal rights and legal
              practitioners. Manage your cases, secure critical legal documents, and
              collaborate transparently through a unified intelligence portal.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" rightIcon={ArrowRight} className="w-full">
                  Create Citizen or Counsel Account
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  Explore Demo Portal
                </Button>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-200/80 max-w-xl mx-auto">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 font-heading">100%</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Role-Based Security</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 font-heading">Encrypted</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Document Vault</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-2xl font-extrabold text-slate-900 font-heading">Real-Time</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Case Tracking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Pathways Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 font-heading">
              Tailored Portals for Every Civic Stakeholder
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Role-specific workflows built to serve both everyday citizens navigating legal issues
              and advocates managing casework.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Citizen Card */}
            <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-8 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="inline-flex p-3 rounded-xl bg-blue-600 text-white mb-5 shadow-sm shadow-blue-600/20">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="CITIZEN" size="xs">CITIZEN ACCESS</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-heading">
                  For Citizens & Individuals
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  File and track legal grievances, organize property and civil evidence, connect with certified counsel, and track key hearing deadlines seamlessly.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {[
                    'Instant legal case filing and progress tracking',
                    'Encrypted personal document vault with case linking',
                    'Direct collaboration with verified legal counsel',
                    'Upcoming hearing and statutory deadline alerts',
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-blue-100">
                <Link to="/register" state={{ defaultRole: 'CITIZEN' }}>
                  <Button variant="primary" className="w-full" rightIcon={ArrowRight}>
                    Register as Citizen
                  </Button>
                </Link>
              </div>
            </div>

            {/* Lawyer Card */}
            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 p-8 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="inline-flex p-3 rounded-xl bg-indigo-600 text-white mb-5 shadow-sm shadow-indigo-600/20">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="LAWYER" size="xs">LEGAL COUNSEL</Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-heading">
                  For Advocates & Legal Practitioners
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Consolidate your client roster, review citizen filings, update case progression stages, annotate legal notes, and access structured evidence dossiers.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {[
                    'Centralized active cases and unassigned intake pool',
                    'Structured client roster with comprehensive case history',
                    'Case notes and status management (Open, In Progress, Closed)',
                    'Secure evidence review without data leaks',
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-indigo-100">
                <Link to="/register" state={{ defaultRole: 'LAWYER' }}>
                  <Button variant="secondary" className="w-full bg-indigo-700 hover:bg-indigo-800" rightIcon={ArrowRight}>
                    Register as Legal Counsel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="PRIMARY" size="xs">PILLARS OF CIVICSPHERE</Badge>
          <h2 className="text-3xl font-bold text-slate-900 font-heading mt-2">
            Built for Integrity, Transparency & Speed
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            A state-of-the-art foundation built using strict role-based access control and modern web technologies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 border-slate-200">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-heading">
              Strict RBAC Architecture
            </h4>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Every API request and frontend view enforces strict role-based boundaries. Citizens cannot view counsel back-offices, and case access is bound to verified ownership.
            </p>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-heading">
              Secure Document Vault
            </h4>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Attach affidavits, legal notices, evidence PDFs, and contracts directly to active cases. Ready for upcoming AI analysis and statutory summaries.
            </p>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-heading">
              Deadlines & Case Intelligence
            </h4>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Maintain visibility over upcoming court dates, mediation sessions, and procedural filings with automatic deadline calculations.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-700" />
            <span className="text-sm font-bold text-slate-900 font-heading">
              CivicSphere AI
            </span>
            <span className="text-xs text-slate-400 ml-2">
              © {new Date().getFullYear()} Civic Intelligence Platform
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
            <Link to="/login" className="hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-blue-600 transition-colors">
              Create Account
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
