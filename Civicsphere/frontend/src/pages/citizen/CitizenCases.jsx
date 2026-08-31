import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Trash2,
  Eye,
  Clock,
  Shield,
  FileText,
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

export const CitizenCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // New Case Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [caseForm, setCaseForm] = useState({
    title: '',
    description: '',
    category: 'Civil Rights',
    priority: 'MEDIUM',
    deadline: '',
    location: '',
  });
  const [savingCase, setSavingCase] = useState(false);
  const [formError, setFormError] = useState('');

  // View Details Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [caseDocuments, setCaseDocuments] = useState([]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await caseService.getCases({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
      });
      if (res && res.cases) {
        setCases(res.cases);
      }
    } catch (err) {
      console.error('[CitizenCases] Error:', err);
      setError('Unable to fetch your case list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCases();
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!caseForm.title.trim() || !caseForm.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }

    try {
      setSavingCase(true);
      setFormError('');
      await caseService.createCase(caseForm);
      setIsNewModalOpen(false);
      setCaseForm({
        title: '',
        description: '',
        category: 'Civil Rights',
        priority: 'MEDIUM',
        deadline: '',
        location: '',
      });
      fetchCases();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create case.');
    } finally {
      setSavingCase(false);
    }
  };

  const handleOpenDetails = async (caseItem) => {
    try {
      setDetailsLoading(true);
      setSelectedCase(caseItem);
      const res = await caseService.getCaseById(caseItem._id);
      if (res && res.case) {
        setSelectedCase(res.case);
        setCaseDocuments(res.documents || []);
      }
    } catch (err) {
      console.error('[CitizenCases] Error loading single case:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteCase = async (id) => {
    if (!window.confirm('Are you sure you want to remove this open case record?')) {
      return;
    }

    try {
      await caseService.deleteCase(id);
      if (selectedCase && selectedCase._id === id) {
        setSelectedCase(null);
      }
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete case.');
    }
  };

  const handleCloseCase = async (id) => {
    if (!window.confirm('Mark this case as CLOSED?')) {
      return;
    }

    try {
      await caseService.updateCase(id, { status: 'CLOSED' });
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update case.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Legal Cases"
        subtitle="Track, manage, and review all civil and statutory matters filed in your account."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsNewModalOpen(true)}
          >
            File New Case
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
            <Input
              placeholder="Search cases by title or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="py-2 text-xs"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>

          {/* Status & Priority Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'IN_PROGRESS' ? 'In Progress' : st}
                </button>
              ))}
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content List */}
      {loading ? (
        <LoadingState message="Fetching legal cases..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCases} />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Legal Cases Match Criteria"
          message="You haven't filed any cases matching the current filters or query."
          actionLabel="File New Case"
          onAction={() => setIsNewModalOpen(true)}
          actionIcon={Plus}
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
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Category:</span>
                    <span className="font-semibold text-slate-700">{c.category}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Deadline:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {c.deadline ? new Date(c.deadline).toLocaleDateString() : 'None'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Legal Counsel:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[140px]">
                      {c.lawyer ? c.lawyer.name : 'Unassigned'}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={Eye}
                  onClick={() => handleOpenDetails(c)}
                  className="text-xs"
                >
                  Details
                </Button>

                {c.status === 'OPEN' && (
                  <button
                    onClick={() => handleDeleteCase(c._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete open case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={selectedCase.title}
          description={`Filed on ${new Date(
            selectedCase.createdAt
          ).toLocaleDateString()} • Case ID: ${selectedCase._id.slice(-6)}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Status & Priority header */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Status:</span>
                <Badge variant={selectedCase.status} size="xs" withDot>
                  {selectedCase.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Priority:</span>
                <Badge variant={selectedCase.priority} size="xs">
                  {selectedCase.priority}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-slate-700">
                  {selectedCase.category}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Case Background & Summary
              </h4>
              <p className="text-xs text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedCase.description}
              </p>
            </div>

            {/* Assigned Counsel Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Assigned Legal Counsel
              </h4>
              {selectedCase.lawyer ? (
                <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedCase.lawyer.name?.charAt(0) || 'L'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {selectedCase.lawyer.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedCase.lawyer.specialization || 'Advocate'} • {selectedCase.lawyer.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="LAWYER" size="xs">Assigned</Badge>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-100">
                  No legal counsel assigned yet. Open for registered advocates to accept.
                </p>
              )}
            </div>

            {/* Lawyer Notes if available */}
            {selectedCase.lawyerNotes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Legal Practitioner Notes & Advisory
                </h4>
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  {selectedCase.lawyerNotes}
                </div>
              </div>
            )}

            {/* Attached Documents List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Associated Evidence & Documents ({caseDocuments.length})
              </h4>
              {caseDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No files linked to this case.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {caseDocuments.map((d) => (
                    <div key={d._id} className="p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-slate-800">{d.title}</span>
                      </div>
                      <Badge variant={d.status} size="xs">{d.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedCase.status !== 'CLOSED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCloseCase(selectedCase._id)}
                >
                  Mark Case as Closed
                </Button>
              ) : (
                <span className="text-xs text-slate-400 italic">Case is closed</span>
              )}

              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedCase(null)}
              >
                Close View
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* File New Case Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="File a New Legal Case"
        description="Submit your grievance details to start managing the matter."
        size="md"
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Case Title"
            placeholder="e.g. Consumer Dispute Against Telecom Service"
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
            <option value="Corporate & Business">Corporate & Business</option>
            <option value="General / Other">General / Other</option>
          </Input>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Priority"
              type="select"
              value={caseForm.priority}
              onChange={(e) =>
                setCaseForm((prev) => ({ ...prev, priority: e.target.value }))
              }
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </Input>

            <Input
              label="Expected Deadline / Court Date"
              type="date"
              value={caseForm.deadline}
              onChange={(e) =>
                setCaseForm((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
          </div>

          <Input
            label="Location / Jurisdiction"
            placeholder="e.g. District Court / City Municipality"
            value={caseForm.location}
            onChange={(e) =>
              setCaseForm((prev) => ({ ...prev, location: e.target.value }))
            }
          />

          <Input
            label="Detailed Case Description"
            type="textarea"
            placeholder="Detailed chronological account of the grievance..."
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
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingCase}
            >
              File Case
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CitizenCases;
