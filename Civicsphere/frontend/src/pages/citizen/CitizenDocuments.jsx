import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Trash2,
  ExternalLink,
  Plus,
  Briefcase,
  Shield,
  FileCheck,
} from 'lucide-react';
import documentService from '../../services/documentService';
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

export const CitizenDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [userCases, setUserCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    fileUrl: '',
    category: 'Legal Evidence',
    caseId: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDocumentsAndCases = async () => {
    try {
      setLoading(true);
      setError(null);

      const [docsRes, casesRes] = await Promise.all([
        documentService.getDocuments({
          search: search || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        }),
        caseService.getCases(),
      ]);

      if (docsRes && docsRes.documents) {
        setDocuments(docsRes.documents);
      }
      if (casesRes && casesRes.cases) {
        setUserCases(casesRes.cases);
      }
    } catch (err) {
      console.error('[CitizenDocuments] Error fetching data:', err);
      setError('Unable to load document vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsAndCases();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocumentsAndCases();
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.title.trim()) {
      setFormError('Document title is required.');
      return;
    }

    try {
      setUploading(true);
      setFormError('');

      // Generate a mock safe URL if not provided
      const mockUrl =
        docForm.fileUrl.trim() ||
        `https://civicsphere.storage/vault/${encodeURIComponent(
          docForm.title.toLowerCase().replace(/\s+/g, '_')
        )}.pdf`;

      await documentService.uploadDocument({
        title: docForm.title,
        fileUrl: mockUrl,
        category: docForm.category,
        caseId: docForm.caseId || undefined,
        description: docForm.description,
      });

      setIsUploadModalOpen(false);
      setDocForm({
        title: '',
        fileUrl: '',
        category: 'Legal Evidence',
        caseId: '',
        description: '',
      });
      fetchDocumentsAndCases();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to store document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this document from your vault?')) {
      return;
    }

    try {
      await documentService.deleteDocument(id);
      fetchDocumentsAndCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Vault"
        subtitle="Securely organize legal notices, affidavits, evidence PDFs, and case contracts."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        }
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Legal Evidence">Legal Evidence</option>
              <option value="Affidavit">Affidavit</option>
              <option value="Notice / Letter">Notice / Letter</option>
              <option value="Identity Proof">Identity Proof</option>
              <option value="Contract / Agreement">Contract / Agreement</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      {loading ? (
        <LoadingState message="Loading documents from vault..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDocumentsAndCases} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Document Vault is Empty"
          message="Upload legal evidence, complaints, or ID proofs to attach to your active matters."
          actionLabel="Upload First Document"
          onAction={() => setIsUploadModalOpen(true)}
          actionIcon={Upload}
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
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
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
                    {doc.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Category:</span>
                    <span className="font-semibold text-slate-700">{doc.category}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Attached Case:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[140px]">
                      {doc.case ? doc.case.title : 'Unlinked Vault Item'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400">Uploaded:</span>
                    <span className="text-slate-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Access File</span>
                </a>

                <button
                  onClick={() => handleDelete(doc._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload to Document Vault"
        description="Store a legal document and optionally link it to one of your active cases."
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Document Title"
            placeholder="e.g., Land Registry Deed Copy (2024)"
            value={docForm.title}
            onChange={(e) =>
              setDocForm((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Document Category"
              type="select"
              value={docForm.category}
              onChange={(e) =>
                setDocForm((prev) => ({ ...prev, category: e.target.value }))
              }
              required
            >
              <option value="Legal Evidence">Legal Evidence</option>
              <option value="Affidavit">Affidavit</option>
              <option value="Notice / Letter">Notice / Letter</option>
              <option value="Identity Proof">Identity Proof</option>
              <option value="Contract / Agreement">Contract / Agreement</option>
            </Input>

            <Input
              label="Associate With Case"
              type="select"
              value={docForm.caseId}
              onChange={(e) =>
                setDocForm((prev) => ({ ...prev, caseId: e.target.value }))
              }
            >
              <option value="">None (General Vault)</option>
              {userCases.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title.length > 25 ? `${c.title.substring(0, 25)}...` : c.title}
                </option>
              ))}
            </Input>
          </div>

          <Input
            label="File URL / Remote Storage Link"
            placeholder="https://storage.civicsphere.org/docs/evidence.pdf"
            value={docForm.fileUrl}
            onChange={(e) =>
              setDocForm((prev) => ({ ...prev, fileUrl: e.target.value }))
            }
            helperText="Leave empty to auto-generate a secure simulated cloud vault URI"
          />

          <Input
            label="Brief Description / Notes"
            type="textarea"
            placeholder="Summary of what this document demonstrates or certifies..."
            value={docForm.description}
            onChange={(e) =>
              setDocForm((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={uploading}
              leftIcon={Upload}
            >
              Store in Vault
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CitizenDocuments;
