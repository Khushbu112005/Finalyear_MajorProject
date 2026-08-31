import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FolderOpen,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
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
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Case Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseForm, setCaseForm] = useState({
    title: '',
    description: '',
    category: 'Civil Rights',
    priority: 'MEDIUM',
    deadline: '',
  });
  const [creatingCase, setCreatingCase] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.getCitizenDashboard();
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('[CitizenDashboard] Error loading metrics:', err);
      setError('Unable to fetch dashboard metrics. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!caseForm.title.trim() || !caseForm.description.trim()) {
      setFormError('Please enter a case title and detailed description.');
      return;
    }

    try {
      setCreatingCase(true);
      setFormError('');
      await caseService.createCase(caseForm);
      setIsModalOpen(false);
      setCaseForm({
        title: '',
        description: '',
        category: 'Civil Rights',
        priority: 'MEDIUM',
        deadline: '',
      });
      // Refresh dashboard
      fetchDashboard();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to file case.');
    } finally {
      setCreatingCase(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Citizen Intelligence Dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const stats = dashboardData?.stats || {
    totalCases: 0,
    openCases: 0,
    totalDocuments: 0,
    upcomingDeadlinesCount: 0,
  };

  const recentCases = dashboardData?.recentCases || [];
  const recentDocuments = dashboardData?.recentDocuments || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Citizen'}`}
        subtitle="Manage your filed legal cases, personal evidence vault, and legal proceedings."
        badge={
          <Badge variant="CITIZEN" size="sm" withDot>
            Citizen Member
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            File New Case
          </Button>
        }
      />

      {/* 4 Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={stats.totalCases}
          icon={Briefcase}
          colorScheme="blue"
          subtitle="All filed legal matters"
        />
        <StatCard
          title="Active Cases"
          value={stats.openCases + (stats.inProgressCases || 0)}
          icon={FolderOpen}
          colorScheme="emerald"
          subtitle={`${stats.openCases} Open / ${stats.inProgressCases || 0} In Progress`}
        />
        <StatCard
          title="Documents"
          value={stats.totalDocuments}
          icon={FileText}
          colorScheme="indigo"
          subtitle="Evidence & briefs stored"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlinesCount}
          icon={Clock}
          colorScheme="amber"
          subtitle="Pending hearings & filings"
        />
      </div>

      {/* Main Grid: Recent Cases & Recent Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Legal Cases</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your most recent active and archived cases
                </p>
              </div>
              <Link to="/citizen/cases">
                <Button variant="ghost" size="sm" rightIcon={ArrowRight}>
                  View All
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {recentCases.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No Cases Filed Yet"
                    message="You haven't registered any legal cases. Click below to file your first grievance."
                    actionLabel="File New Case"
                    onAction={() => setIsModalOpen(true)}
                    actionIcon={Plus}
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
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {c.description}
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
                        <Link to="/citizen/cases">
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Documents Vault Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Evidence Vault</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Stored files</p>
              </div>
              <Link to="/citizen/documents">
                <Button variant="ghost" size="sm" rightIcon={ArrowRight}>
                  Vault
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {recentDocuments.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No Documents Uploaded"
                    message="Upload case documents to keep them securely organized."
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {doc.category || 'Evidence'}
                          </p>
                        </div>
                      </div>

                      <Badge variant={doc.status} size="xs">
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Legal Help Banner */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Civic Advisory
              </span>
            </div>
            <h4 className="text-sm font-bold font-heading">
              Need Legal Counsel Consultation?
            </h4>
            <p className="mt-1 text-xs text-blue-100/90 leading-relaxed">
              When filing a case, you can tag certified practitioners to review your case dossier.
            </p>
          </div>
        </div>
      </div>

      {/* File New Case Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File New Legal Case"
        description="Provide comprehensive details about your civic or legal grievance."
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Case Title / Subject"
            placeholder="e.g., Unlawful Property Encroachment Notice"
            value={caseForm.title}
            onChange={(e) =>
              setCaseForm((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />

          <Input
            label="Legal Category"
            type="select"
            value={caseForm.category}
            onChange={(e) =>
              setCaseForm((prev) => ({ ...prev, category: e.target.value }))
            }
            required
          >
            <option value="Civil Rights">Civil Rights</option>
            <option value="Property & Land">Property & Land</option>
            <option value="Family & Domestic">Family & Domestic</option>
            <option value="Consumer Protection">Consumer Protection</option>
            <option value="Labor & Employment">Labor & Employment</option>
            <option value="Criminal Defense">Criminal Defense</option>
            <option value="General / Other">General / Other</option>
          </Input>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Priority Level"
              type="select"
              value={caseForm.priority}
              onChange={(e) =>
                setCaseForm((prev) => ({ ...prev, priority: e.target.value }))
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Input>

            <Input
              label="Expected Hearing / Deadline"
              type="date"
              value={caseForm.deadline}
              onChange={(e) =>
                setCaseForm((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
          </div>

          <Input
            label="Case Narrative / Description"
            type="textarea"
            placeholder="Explain the background events, dates, relevant government or private parties involved..."
            value={caseForm.description}
            onChange={(e) =>
              setCaseForm((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={4}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={creatingCase}
            >
              Submit Case Dossier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CitizenDashboard;
