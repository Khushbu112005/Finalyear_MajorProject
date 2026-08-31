import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Mail, Lock, LogIn, AlertCircle, ArrowRight, Shield, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent } from '../../components/ui/Card';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if redirected from expired session
  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('session') === 'expired';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success && result.user) {
      // Role-based redirection
      if (result.user.role === 'LAWYER') {
        navigate('/lawyer/dashboard', { replace: true });
      } else {
        navigate('/citizen/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(result.message || 'Login failed. Please verify your credentials.');
    }
  };

  // Demo auto-fill helpers
  const fillDemo = (role) => {
    if (role === 'CITIZEN') {
      setFormData({
        email: 'citizen@civicsphere.com',
        password: 'password123',
      });
    } else {
      setFormData({
        email: 'lawyer@civicsphere.com',
        password: 'password123',
      });
    }
    setErrors({});
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 subtle-mesh-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-700/20 group-hover:scale-105 transition-transform">
            <Scale className="h-6 w-6 stroke-[2]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            CivicSphere AI
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
          Sign In to Your Portal
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Enter your credentials to access your legal cases and workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-sm">
          {/* Expired / Error Banner */}
          {isExpired && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Your session has expired. Please log in again.</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="name@civicsphere.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
              required
              autoComplete="email"
            />

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
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              leftIcon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Login Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 text-center mb-2.5">
              Quick Demo Fill
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('CITIZEN')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('LAWYER')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Lawyer Demo</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer link to Register */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Do not have an account yet?{' '}
          <Link
            to="/register"
            className="font-bold text-blue-700 hover:text-blue-800 hover:underline"
          >
            Register for CivicSphere
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
