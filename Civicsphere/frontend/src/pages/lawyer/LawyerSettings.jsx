import React, { useState } from 'react';
import { Bell, Scale, ShieldCheck, Check } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const LawyerSettings = () => {
  const [settings, setSettings] = useState({
    intakeOpen: true,
    instantDocketAlerts: true,
    documentUploadNotices: true,
    dailyHearingDigest: true,
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
        title="Practice Settings & Preferences"
        subtitle="Manage client intake availability, hearing reminders, and confidential communication preferences."
      />

      {saved && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Practice settings updated successfully!</span>
        </div>
      )}

      {/* Practice Intake Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            <CardTitle>Case Intake Availability</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Accept New Citizen Representations
              </p>
              <p className="text-[11px] text-slate-400">
                Keep your practice profile listed in the verified counsel directory for citizen assignment.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.intakeOpen}
              onChange={() => toggle('intakeOpen')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">
                New Unassigned Matter Notifications
              </p>
              <p className="text-[11px] text-slate-400">
                Get notified when citizens file matters matching your primary specialization.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.instantDocketAlerts}
              onChange={() => toggle('instantDocketAlerts')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hearing & Evidence Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <CardTitle>Docket & Evidence Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Client Document Upload Alerts
              </p>
              <p className="text-[11px] text-slate-400">
                Alert immediately when a client attaches evidence or affidavits to an active docket.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.documentUploadNotices}
              onChange={() => toggle('documentUploadNotices')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Daily Hearing Morning Digest</p>
              <p className="text-[11px] text-slate-400">
                Receive an email summary of all active procedural deadlines for the day.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.dailyHearingDigest}
              onChange={() => toggle('dailyHearingDigest')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              className="bg-indigo-700 hover:bg-indigo-800"
              onClick={handleSave}
            >
              Save Practice Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LawyerSettings;
