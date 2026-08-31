import React, { useState } from 'react';
import { Bell, Shield, Eye, Lock, Check } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const CitizenSettings = () => {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    deadlineReminders: true,
    counselUpdates: true,
    documentAuditTrail: true,
  });

  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Privacy"
        subtitle="Manage notifications, case alerts, and data preferences."
      />

      {saved && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <CardTitle>Case & Hearing Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">Case Status Updates</p>
              <p className="text-[11px] text-slate-400">
                Receive instant notifications when an advocate updates your case.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={() => toggle('emailAlerts')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">Upcoming Hearing Deadlines</p>
              <p className="text-[11px] text-slate-400">
                Get reminders 48 hours prior to expected court or mediation filings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.deadlineReminders}
              onChange={() => toggle('deadlineReminders')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Counsel Assignment Alerts</p>
              <p className="text-[11px] text-slate-400">
                Get notified when an advocate accepts your unassigned matter.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.counselUpdates}
              onChange={() => toggle('counselUpdates')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security & Vault Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <CardTitle>Vault & Security Policy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">Document Access Audit Log</p>
              <p className="text-[11px] text-slate-400">
                Enforce immutable timestamping on evidence dossier viewings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.documentAuditTrail}
              onChange={() => toggle('documentAuditTrail')}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="primary" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenSettings;
