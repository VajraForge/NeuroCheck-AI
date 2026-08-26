import React, { useState } from 'react';
import { Brain, User, Lock, Mail, UserPlus, Stethoscope, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
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
        email: formData.email || null,
        age: formData.age ? parseInt(formData.age) : null,
        medical_id: formData.medical_id || null,
        role: 'patient'
      });
      localStorage.setItem('neurocheck_token', data.access_token);
      localStorage.setItem('neurocheck_user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    if (role === 'patient') {
      const user = { username: 'demo_patient', full_name: 'John Doe (Demo)', role: 'patient', age: 68, medical_id: 'PT-48201' };
      localStorage.setItem('neurocheck_user', JSON.stringify(user));
      onAuthSuccess(user);
    } else {
      const user = { username: 'clinician', full_name: 'Dr. Sarah Vance, MD', role: 'doctor' };
      localStorage.setItem('neurocheck_user', JSON.stringify(user));
      onAuthSuccess(user);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-neuro-dark">
      {/* Glow background accents */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-neuro-glow/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-neuro-accent/15 rounded-full blur-[130px] pointer-events-none" />

      <div className="glass-panel max-w-lg w-full p-8 md:p-10 rounded-3xl z-10 border-neuro-glow/40 shadow-2xl relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mb-3 border-neuro-glow/60 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Brain className="w-9 h-9 text-neuro-glow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            NeuroCheck <span className="text-neuro-glow font-light">AI</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Multi-Modal Neurological Screening, Tremor Kinematics & Voice Biomarkers
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-black/40 p-1 mb-6 border border-white/10 text-xs">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
              mode === 'login' ? 'bg-neuro-card text-neuro-glow shadow-md border border-neuro-glow/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Patient Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
              mode === 'register' ? 'bg-neuro-card text-neuro-glow shadow-md border border-neuro-glow/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create Account
          </button>
          <button
            onClick={() => { setMode('doctor'); setError(null); }}
            className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
              mode === 'doctor' ? 'bg-neuro-card text-neuro-accent shadow-md border border-neuro-accent/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Doctor Login
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form: Patient Sign In */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. sam or john_doe"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-10 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn !bg-neuro-glow !text-black !font-bold py-3 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In & Access Screening'} <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('patient')}
                className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 transition text-center"
              >
                ⚡ Quick Demo: Enter as John Doe (68y Patient)
              </button>
            </div>
          </form>
        )}

        {/* Form: Create Patient Account */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Legal Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="e.g. Sam Wilson"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. sam"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 40"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sam@example.com"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Password (Min. 6 chars) *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Choose a password (min 6 characters)"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-glow transition placeholder-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn !bg-neuro-glow !text-black !font-bold py-3 text-sm flex items-center justify-center gap-2 mt-3"
            >
              {loading ? 'Creating Account...' : 'Create My Patient Account'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form: Doctor / Clinical Access */}
        {mode === 'doctor' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Clinician Portal with Multi-Patient Telemetry, PDF Export & Care Engine.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Clinician ID / Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="e.g. clinician"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-accent transition placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Security Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Password (default: neurocheck2026)"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neuro-accent transition placeholder-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glass-btn !bg-neuro-accent !text-black !font-bold py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Access Clinical Station'} <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('doctor')}
              className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 transition text-center"
            >
              ⚡ Quick Demo: Enter as Dr. Sarah Vance, MD
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <CheckCircle className="w-3.5 h-3.5 text-neuro-accent" />
          <span>Local WebAssembly & HIPAA-compliant de-identification standard.</span>
        </div>
      </div>
    </div>
  );
}
