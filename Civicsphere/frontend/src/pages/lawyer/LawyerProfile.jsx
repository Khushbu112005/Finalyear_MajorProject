import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Briefcase, Award, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const LawyerProfile = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialization: user?.specialization || 'Civil & Property Law',
    barCouncilId: user?.barCouncilId || '',
    experienceYears: user?.experienceYears || 5,
    address: user?.address || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        specialization: formData.specialization,
        barCouncilId: formData.barCouncilId,
        experienceYears: Number(formData.experienceYears),
        address: formData.address,
        bio: formData.bio,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined,
      });

      if (result && result.success) {
        setSuccessMessage('Practitioner credentials successfully updated!');
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
        }));
      } else {
        setErrorMessage(result?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Legal Counsel Credentials"
        subtitle="Manage your bar registration, specializations, contact channels, and practice credentials."
      />

      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Practitioner Card */}
        <Card className="p-6 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-indigo-700 text-white flex items-center justify-center text-2xl font-bold font-heading shadow-md shadow-indigo-700/20 mb-3">
            {user?.name?.charAt(0).toUpperCase() || 'L'}
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            {user?.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

          <div className="mt-3">
            <Badge variant="LAWYER" size="sm" withDot>
              Advocate & Legal Counsel
            </Badge>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 w-full text-left space-y-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Bar Registration:</span>
              <span className="font-mono font-semibold text-slate-800">
                {user?.barCouncilId || 'Verified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Primary Field:</span>
              <span className="font-semibold text-indigo-700 truncate max-w-[120px]">
                {user?.specialization || 'General'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Experience:</span>
              <span className="font-semibold text-slate-700">
                {user?.experienceYears || 5} Years
              </span>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name / Counsel Title"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  icon={User}
                  required
                />
                <Input
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  disabled
                  icon={Mail}
                  helperText="Registered counsel email"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Primary Specialization"
                  name="specialization"
                  type="select"
                  value={formData.specialization}
                  onChange={handleChange}
                >
                  <option value="Civil & Property Law">Civil & Property Law</option>
                  <option value="Constitutional & Rights">Constitutional & Rights</option>
                  <option value="Criminal Defense">Criminal Defense</option>
                  <option value="Family & Domestic Law">Family & Domestic Law</option>
                  <option value="Labor & Employment">Labor & Employment</option>
                  <option value="Corporate & Contract">Corporate & Contract</option>
                  <option value="General Practice">General Practice</option>
                </Input>

                <Input
                  label="Bar Council Registration ID"
                  name="barCouncilId"
                  value={formData.barCouncilId}
                  onChange={handleChange}
                  placeholder="e.g. BAR/2022/9847"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={Phone}
                  placeholder="+1 (555) 000-0000"
                />
                <Input
                  label="Years in Practice"
                  name="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Chambers / Office Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                icon={MapPin}
                placeholder="Court Chambers, Suite 402, Judicial Plaza"
              />

              <Input
                label="Professional Biography & Notable Areas"
                name="bio"
                type="textarea"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Background on landmark matters, dispute resolution specialties..."
                rows={3}
              />

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Update Account Password (Optional)
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="bg-indigo-700 hover:bg-indigo-800"
                  isLoading={saving}
                  leftIcon={Save}
                >
                  Save Practitioner Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LawyerProfile;
