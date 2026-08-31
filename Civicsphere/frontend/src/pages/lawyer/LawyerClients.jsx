import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Briefcase, ChevronRight, Eye } from 'lucide-react';
import authService from '../../services/authService';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

export const LawyerClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.getLawyerClients();
      if (res && res.clients) {
        setClients(res.clients);
      }
    } catch (err) {
      console.error('[LawyerClients] Error:', err);
      setError('Unable to load client representations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Representation Directory"
        subtitle="Citizen clients whose active or past legal matters are assigned to your counsel."
      />

      {loading ? (
        <LoadingState message="Loading client directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchClients} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Client Records Yet"
          message="When you accept or are assigned citizen matters, their profiles and history will populate here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((entry) => {
            const client = entry.client;
            return (
              <Card
                key={client._id}
                className="flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-base font-heading shrink-0">
                      {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-bold text-slate-900 font-heading truncate">
                        {client.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">{client.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Active Cases</p>
                      <p className="text-base font-bold text-indigo-700 font-heading">
                        {entry.activeCases}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Total Matters</p>
                      <p className="text-base font-bold text-slate-800 font-heading">
                        {entry.totalCases}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone || 'No phone recorded'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.address || 'Address unlisted'}</span>
                    </div>
                  </div>
                </CardContent>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    leftIcon={Eye}
                    onClick={() => setSelectedClient(entry)}
                  >
                    View Matters ({entry.totalCases})
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Client Matters Modal */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={`Client Portfolio: ${selectedClient.client?.name}`}
          description={`Contact: ${selectedClient.client?.email} • ${
            selectedClient.client?.phone || 'No phone'
          }`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cases Under Legal Representation ({selectedClient.cases.length})
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {selectedClient.cases.map((c) => (
                <div key={c._id} className="p-3.5 bg-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 font-heading">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Category: {c.category} • Due:{' '}
                      {c.deadline ? new Date(c.deadline).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <Badge variant={c.status} size="xs" withDot>
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedClient(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LawyerClients;
