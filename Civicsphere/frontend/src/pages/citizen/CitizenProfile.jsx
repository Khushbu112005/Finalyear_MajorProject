import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const CitizenProfile = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
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
        address: formData.address,
        bio: formData.bio,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined,
      });

      if (result && result.success) {
        setSuccessMessage('Profile details successfully updated!');
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
        title="Citizen Profile"
        subtitle="Manage your identity credentials, contact details, and account security."
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
        {/* Left Profile Overview Card */}
        <Card className="p-6 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-blue-700 text-white flex items-center justify-center text-2xl font-bold font-heading shadow-md shadow-blue-700/20 mb-3">
            {user?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            {user?.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

          <div className="mt-4">
            <Badge variant="CITIZEN" size="sm" withDot>
              Citizen Member
            </Badge>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 w-full text-left space-y-2 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Member Since:</span>
              <span className="font-semibold text-slate-700">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Security Clearance:</span>
              <span className="text-emerald-600 font-bold">Standard</span>
            </div>
          </div>
        </Card>

        {/* Right Edit Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
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
                  helperText="Contact admin to modify registered email"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={Phone}
                  placeholder="+1 (555) 000-0000"
                />
                <Input
                  label="Residential City / Region"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  icon={MapPin}
                  placeholder="e.g. New York, NY"
                />
              </div>

              <Input
                label="About / Bio"
                name="bio"
                type="textarea"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief summary of your legal background or status..."
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
                  variant="primary"
                  size="sm"
                  isLoading={saving}
                  leftIcon={Save}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenProfile;
