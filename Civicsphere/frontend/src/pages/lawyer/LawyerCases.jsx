import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  Clock,
  User,
  Edit3,
  PlusCircle,
  FileText,
  Eye,
} from 'lucide-react';
import caseService from '../../services/caseService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export const LawyerCases = () => {
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'open'
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit / Manage Modal State
  const [selectedCase, setSelectedCase] = useState(null);
  const [manageForm, setManageForm] = useState({
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    deadline: '',
    courtReference: '',
    lawyerNotes: '',
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await caseService.getCases({
        type: activeTab,
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res && res.cases) {
        setCases(res.cases);
      }
    } catch (err) {
      console.error('[LawyerCases] Error loading cases:', err);
      setError('Unable to fetch cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCases();
  };

  const handleOpenManageModal = (caseItem) => {
    setSelectedCase(caseItem);
    setManageForm({
      status: caseItem.status || 'IN_PROGRESS',
      priority: caseItem.priority || 'MEDIUM',
      deadline: caseItem.deadline ? caseItem.deadline.substring(0, 10) : '',
      courtReference: caseItem.courtReference || '',
      lawyerNotes: caseItem.lawyerNotes || '',
    });
  };

  const handleSaveCaseUpdates = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      setSavingStatus(true);
      await caseService.updateCase(selectedCase._id, {
        status: manageForm.status,
        priority: manageForm.priority,
        deadline: manageForm.deadline || null,
        courtReference: manageForm.courtReference,
        lawyerNotes: manageForm.lawyerNotes,
      });
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update case.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAcceptCase = async (caseId) => {
    try {
      setAcceptingId(caseId);
      await caseService.assignCase(caseId);
      // Switch to assigned tab after accepting
      setActiveTab('assigned');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept case.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Docket & Representation"
        subtitle="Manage assigned client proceedings, update case milestones, or accept new citizen briefs."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'assigned'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Assigned Cases
        </button>
        <button
          onClick={() => setActiveTab('open')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'open'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Open Intake Pool (Unassigned)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
            <Input
              placeholder="Search case title or brief..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="py-2 text-xs"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>

          {activeTab === 'assigned' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'IN_PROGRESS' ? 'In Progress' : st}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Case Cards */}
      {loading ? (
        <LoadingState message="Fetching docket proceedings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCases} />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={Scale}
          title={
            activeTab === 'assigned'
              ? 'No Assigned Cases In Your Docket'
              : 'No Open Cases in Intake Queue'
          }
          message={
            activeTab === 'assigned'
              ? 'You do not have any active representations. Browse the Open Intake Pool to take up matters.'
              : 'All citizen matters currently have counsel assigned.'
          }
          actionLabel={activeTab === 'assigned' ? 'Browse Open Intake' : undefined}
          onAction={activeTab === 'assigned' ? () => setActiveTab('open') : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card
              key={c._id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={c.status} size="xs" withDot>
                    {c.status}
                  </Badge>
                  <Badge variant={c.priority} size="xs">
                    {c.priority}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Client:</span>
                    <span className="font-semibold text-slate-800">
                      {c.citizen?.name || 'Citizen'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Category:</span>
                    <span className="font-medium text-slate-700">{c.category}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Deadline:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {c.deadline ? new Date(c.deadline).toLocaleDateString() : 'None'}
                    </span>
                  </div>

                  {c.courtReference && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-slate-400">Court Ref:</span>
                      <span className="font-mono text-[11px] text-indigo-700">
                        {c.courtReference}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                {activeTab === 'assigned' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Edit3}
                    onClick={() => handleOpenManageModal(c)}
                    className="w-full text-xs"
                  >
                    Manage / Update Status
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-xs"
                    leftIcon={PlusCircle}
                    isLoading={acceptingId === c._id}
                    onClick={() => handleAcceptCase(c._id)}
                  >
                    Accept Representation
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Case Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Manage Case: ${selectedCase.title}`}
          description={`Client: ${selectedCase.citizen?.name} (${selectedCase.citizen?.email})`}
          size="lg"
        >
          <form onSubmit={handleSaveCaseUpdates} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Case Progression Status"
                type="select"
                value={manageForm.status}
                onChange={(e) =>
                  setManageForm((prev) => ({ ...prev, status: e.target.value }))
                }
                required
              >
                <option value="OPEN">OPEN (Initial Intake)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Under Legal Action)</option>
                <option value="CLOSED">CLOSED (Resolved / Concluded)</option>
              </Input>

              <Input
                label="Priority Level"
                type="select"
                value={manageForm.priority}
                onChange={(e) =>
                  setManageForm((prev) => ({ ...prev, priority: e.target.value }))
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Input>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Next Hearing / Court Deadline"
                type="date"
                value={manageForm.deadline}
                onChange={(e) =>
                  setManageForm((prev) => ({ ...prev, deadline: e.target.value }))
                }
              />

              <Input
                label="Court Docket / Case Reference No."
                placeholder="e.g. HC/CIV/2026/0912"
                value={manageForm.courtReference}
                onChange={(e) =>
                  setManageForm((prev) => ({
                    ...prev,
                    courtReference: e.target.value,
                  }))
                }
              />
            </div>

            <Input
              label="Counsel Notes & Advisory (Visible to Client)"
              type="textarea"
              placeholder="Provide strategic updates, next required evidence, hearing outcomes..."
              value={manageForm.lawyerNotes}
              onChange={(e) =>
                setManageForm((prev) => ({
                  ...prev,
                  lawyerNotes: e.target.value,
                }))
              }
              rows={4}
            />

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCase(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="bg-indigo-700 hover:bg-indigo-800"
                isLoading={savingStatus}
              >
                Save Docket Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LawyerCases;
