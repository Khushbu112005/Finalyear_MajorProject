import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import documentService from '../../services/documentService';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export const LawyerDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await documentService.getDocuments({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res && res.documents) {
        setDocuments(res.documents);
      }
    } catch (err) {
      console.error('[LawyerDocuments] Error:', err);
      setError('Unable to load client evidence dossiers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleUpdateStatus = async (docId, newStatus) => {
    try {
      await documentService.updateStatus(docId, newStatus);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update document status.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Evidence Dossiers"
        subtitle="Review, verify, and clear evidence documents uploaded by clients for assigned proceedings."
      />

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
            <Input
              placeholder="Search document title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="py-2 text-xs"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'UPLOADED', 'PROCESSING', 'READY'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <LoadingState message="Fetching client documents..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDocuments} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Evidence Dossiers Found"
          message="No documents matching the selected filters are associated with your assigned cases."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc._id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Badge variant={doc.status} size="xs" withDot>
                    {doc.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading truncate">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {doc.description || 'Evidence document'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Associated Matter:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                      {doc.case ? doc.case.title : 'General Brief'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Uploaded By:</span>
                    <span className="font-medium text-slate-700">
                      {doc.uploadedBy?.name || 'Client'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Category:</span>
                    <span className="text-slate-600">{doc.category}</span>
                  </div>
                </div>
              </CardContent>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Document</span>
                </a>

                {doc.status !== 'READY' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-emerald-700 hover:bg-emerald-50"
                    leftIcon={CheckCircle}
                    onClick={() => handleUpdateStatus(doc._id, 'READY')}
                  >
                    Mark Verified
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LawyerDocuments;
