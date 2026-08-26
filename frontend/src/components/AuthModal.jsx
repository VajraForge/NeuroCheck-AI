import React, { useState } from 'react';
import { Brain, User, Lock, Mail, UserPlus, Stethoscope, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { apiRegister, apiLogin } from '../utils/api';

export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'doctor'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    age: '',
    medical_id: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin({
        username: formData.username,
        password: formData.password
      });
      localStorage.setItem('neurocheck_token', data.access_token);
      localStorage.setItem('neurocheck_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiRegister({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        role: 'patient'
      });
      localStorage.setItem('neurocheck_token', data.access_token);
      localStorage.setItem('neurocheck_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    if (role === 'doctor') {
      const user = { username: 'dr_sharma', full_name: 'Dr. Anita Sharma, MD', role: 'doctor', medical_id: 'NEURO-4821' };
      localStorage.setItem('neurocheck_user', JSON.stringify(user));
      onAuthSuccess(user);
    } else {
      const user = { username: 'john_doe', full_name: 'John Doe', role: 'patient', age: 68 };
      localStorage.setItem('neurocheck_user', JSON.stringify(user));
      onAuthSuccess(user);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F8FAFC] bg-med-canvas">
      <div className="glass-panel max-w-md w-full p-8 md:p-10 rounded-3xl z-10 shadow-xl border border-slate-200 bg-white relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 border border-sky-500 flex items-center justify-center mb-3 text-white shadow-md shadow-sky-600/20">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            NEUROCHECK <span className="text-sky-600 font-light">AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs font-medium">
            Clinical Tri-Modal Neurological Screening & Kinetic Telemetry
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200 text-xs">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register
          </button>
          <button
            onClick={() => { setMode('doctor'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
              mode === 'doctor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Doctor
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form: Patient Sign In */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. sam or john_doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn !bg-sky-600 hover:!bg-sky-700 !text-white !font-bold py-3 text-sm flex items-center justify-center gap-2 mt-2 shadow-md shadow-sky-600/20"
            >
              {loading ? 'Authenticating...' : 'Sign In & Access Screening'} <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('patient')}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold transition text-center shadow-sm"
              >
                ⚡ Fast Demo: Sign In as John Doe (68y Patient)
              </button>
            </div>
          </form>
        )}

        {/* Form: Create Patient Account */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="e.g. Sam Wilson"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. sam"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 68"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sam@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password (Min. 6 chars) *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Choose a secure password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white transition placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn !bg-sky-600 hover:!bg-sky-700 !text-white !font-bold py-3 text-sm flex items-center justify-center gap-2 mt-3 shadow-md shadow-sky-600/20"
            >
              {loading ? 'Creating Account...' : 'Create Patient Account'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form: Doctor / Clinical Access */}
        {mode === 'doctor' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>Clinician Portal with Multi-Patient Telemetry, PDF Export & Care Engine.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinician ID / Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="e.g. clinician"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Security Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password (default: neurocheck2026)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn !bg-indigo-600 hover:!bg-indigo-700 !text-white !font-bold py-3 text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              {loading ? 'Authenticating...' : 'Access Clinical Station'} <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('doctor')}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold transition text-center shadow-sm"
            >
              ⚡ Fast Demo: Sign In as Dr. Anita Sharma, MD
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
