import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Scale,
  User,
  Mail,
  Lock,
  UserPlus,
  Briefcase,
  AlertCircle,
  Check,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const initialRole = location.state?.defaultRole || 'CITIZEN';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    phone: '',
    specialization: '',
    barCouncilId: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const setRole = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.email = 'Please provide a valid email';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'LAWYER') {
      if (!formData.specialization.trim()) {
        errs.specialization = 'Please select or enter your legal practice area';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setIsLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
      specialization: formData.specialization,
      barCouncilId: formData.barCouncilId,
    });
    setIsLoading(false);

    if (result.success && result.user) {
      if (result.user.role === 'LAWYER') {
        navigate('/lawyer/dashboard', { replace: true });
      } else {
        navigate('/citizen/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(result.message || 'Registration failed. Please review your input.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 subtle-mesh-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-700/20 group-hover:scale-105 transition-transform">
            <Scale className="h-6 w-6 stroke-[2]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            CivicSphere AI
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
          Create Your CivicSphere Account
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Join the legal intelligence portal as a Citizen or Legal Counsel.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Visual Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Select Your Role <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CITIZEN')}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    formData.role === 'CITIZEN'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <User
                      className={`w-5 h-5 ${
                        formData.role === 'CITIZEN' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    {formData.role === 'CITIZEN' && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className="mt-2 text-sm font-bold text-slate-900 font-heading">
                    Citizen
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    File cases, upload documents & seek legal aid
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('LAWYER')}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    formData.role === 'LAWYER'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Briefcase
                      className={`w-5 h-5 ${
                        formData.role === 'LAWYER' ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    {formData.role === 'LAWYER' && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className="mt-2 text-sm font-bold text-slate-900 font-heading">
                    Legal Counsel
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Manage client briefs, legal docket & case files
                  </span>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                placeholder="Adv. John Doe / Jane Citizen"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                icon={User}
                required
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="counsel@civicsphere.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
                required
              />
            </div>

            {/* Lawyer-Specific Fields */}
            {formData.role === 'LAWYER' && (
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100">
                <Input
                  label="Legal Specialization"
                  name="specialization"
                  type="select"
                  value={formData.specialization}
                  onChange={handleChange}
                  error={errors.specialization}
                  required
                >
                  <option value="">Select Primary Practice Area</option>
                  <option value="Civil & Property Law">Civil & Property Law</option>
                  <option value="Constitutional & Rights">Constitutional & Rights</option>
                  <option value="Criminal Defense">Criminal Defense</option>
                  <option value="Family & Domestic Law">Family & Domestic Law</option>
                  <option value="Labor & Employment">Labor & Employment</option>
                  <option value="Corporate & Contract">Corporate & Contract</option>
                  <option value="General Practice">General Practice</option>
                </Input>

                <Input
                  label="Bar Council ID / Reg No"
                  name="barCouncilId"
                  placeholder="e.g. BAR/2022/9847"
                  value={formData.barCouncilId}
                  onChange={handleChange}
                  error={errors.barCouncilId}
                  helperText="Optional for foundation demo"
                />
              </div>
            )}

            {/* Phone */}
            <Input
              label="Contact Phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 019-2834"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            {/* Password */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={Lock}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              isLoading={isLoading}
              leftIcon={UserPlus}
            >
              Complete Registration
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-blue-700 hover:text-blue-800 hover:underline"
          >
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
