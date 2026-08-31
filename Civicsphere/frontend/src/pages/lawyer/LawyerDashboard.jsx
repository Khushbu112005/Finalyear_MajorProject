import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Users,
  FileCheck2,
  Clock,
  ArrowRight,
  Briefcase,
  UserCheck,
  CheckCircle,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import caseService from '../../services/caseService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const LawyerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.getLawyerDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('[LawyerDashboard] Error:', err);
      setError('Unable to fetch legal counsel metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAcceptCase = async (caseId) => {
    try {
      setAcceptingId(caseId);
      await caseService.assignCase(caseId);
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept case.');
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Legal Counsel Intelligence Dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const stats = dashboardData?.stats || {
    assignedCases: 0,
    activeCases: 0,
    activeClientsCount: 0,
    pendingDocumentsCount: 0,
    upcomingDeadlinesCount: 0,
    availableOpenCasesCount: 0,
  };

  const recentCases = dashboardData?.recentCases || [];
  const availableOpenCases = dashboardData?.availableOpenCases || [];
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Counsel Overview: ${user?.name || 'Advocate'}`}
        subtitle={`${user?.specialization || 'General Legal Practice'} • Bar Reg: ${
          user?.barCouncilId || 'Verified Counsel'
        }`}
        badge={
          <Badge variant="LAWYER" size="sm" withDot>
            Legal Practitioner
          </Badge>
        }
        actions={
          <Link to="/lawyer/cases">
            <Button variant="secondary" size="sm" rightIcon={ArrowRight}>
              Open Case Docket
            </Button>
          </Link>
        }
      />

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Cases"
          value={stats.assignedCases}
          icon={Scale}
          colorScheme="indigo"
          subtitle={`${stats.activeCases || 0} active matters`}
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClientsCount}
          icon={Users}
          colorScheme="blue"
          subtitle="Direct citizen representations"
        />
        <StatCard
          title="Evidence Pending"
          value={stats.pendingDocumentsCount}
          icon={FileCheck2}
          colorScheme="amber"
          subtitle="Awaiting review/clearance"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlinesCount}
          icon={Clock}
          colorScheme="rose"
          subtitle="Hearings & procedural dates"
        />
      </div>

      {/* Main Grid: Active Cases & Intake Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Assigned Cases */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Client Representations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cases currently under your active legal counsel
                </p>
              </div>
              <Link to="/lawyer/cases">
                <Button variant="ghost" size="sm" rightIcon={ArrowRight}>
                  All Cases
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {recentCases.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No Assigned Cases"
                    message="You haven't accepted any cases yet. Review the open intake pool below."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentCases.map((c) => (
                    <div
                      key={c._id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 font-heading">
                            {c.title}
                          </span>
                          <Badge variant={c.status} size="xs" withDot>
                            {c.status}
                          </Badge>
                          <Badge variant={c.priority} size="xs">
                            {c.priority}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          Client: <span className="font-semibold text-slate-700">{c.citizen?.name || 'Citizen'}</span> ({c.citizen?.email})
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{c.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {c.deadline
                              ? new Date(c.deadline).toLocaleDateString()
                              : 'No deadline set'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to="/lawyer/cases">
                          <Button variant="outline" size="sm">
                            Manage Docket
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Open Intake Pool */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between bg-indigo-50/30">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Open Citizen Matters Pool</CardTitle>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {availableOpenCases.length} available
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Citizen filings awaiting legal representation
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {availableOpenCases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No open unassigned matters currently in the intake queue.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {availableOpenCases.map((c) => (
                    <div
                      key={c._id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900 font-heading">
                          {c.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {c.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-indigo-600">{c.category}</span>
                          <span>•</span>
                          <span>By {c.citizen?.name}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-indigo-700 hover:bg-indigo-800 shrink-0 text-xs"
                        leftIcon={PlusCircle}
                        isLoading={acceptingId === c._id}
                        onClick={() => handleAcceptCase(c._id)}
                      >
                        Accept Case
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Deadlines & Quick Client Highlights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                <CardTitle>Docket Schedule</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {upcomingDeadlines.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No immediate statutory dates scheduled.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingDeadlines.map((dl) => (
                    <div key={dl._id} className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                          {dl.title}
                        </span>
                        <Badge variant={dl.priority} size="xs">
                          {dl.priority}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Client: {dl.citizen?.name || 'Citizen'}
                      </p>
                      <p className="text-xs font-semibold text-rose-600">
                        Due: {new Date(dl.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Practice Info Card */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-indigo-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Practice Intelligence
              </span>
            </div>
            <h4 className="text-sm font-bold font-heading">
              Secure Counsel Operations
            </h4>
            <p className="mt-1 text-xs text-indigo-100/80 leading-relaxed">
              Every client engagement has dedicated evidence dossiers. Notes recorded here remain strictly confined to the practitioner and client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard;
