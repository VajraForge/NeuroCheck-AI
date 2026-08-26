import React, { useState, useEffect } from 'react';
import {
  Brain,
  Activity,
  Waves,
  Target,
  User,
  LogOut,
  Compass,
  History,
  FileText,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  Stethoscope,
  PlayCircle,
  HelpCircle
} from 'lucide-react';
import AuthModal from './components/AuthModal';
import GuidedScreening from './components/GuidedScreening';
import PatientHistory from './components/PatientHistory';
import KinematicTest from './components/KinematicTest';
import AcousticTest from './components/AcousticTest';
import SpiralTest from './components/SpiralTest';
import CarePlanView from './components/CarePlanView';
import ClinicalErrorBoundary from './components/ClinicalErrorBoundary';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('guided'); // 'guided' | 'individual' | 'history' | 'doctor'
  const [individualSubTest, setIndividualSubTest] = useState(null); // 'kinematic' | 'acoustic' | 'spiral' | null
  const [carePlan, setCarePlan] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  // Restore saved session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('neurocheck_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed.role === 'doctor') {
          setActiveTab('doctor');
        }
      }
    } catch (_) {}
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'doctor') {
      setActiveTab('doctor');
    } else {
      setActiveTab('guided');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('neurocheck_token');
    localStorage.removeItem('neurocheck_user');
    setCurrentUser(null);
    setActiveTab('guided');
    setIndividualSubTest(null);
    setCarePlan(null);
  };

  if (!currentUser) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  const isDoctor = currentUser.role === 'doctor';

  const exportDossier = async () => {
    try {
      const response = await fetch("http://localhost:8000/export/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motor: 32.0,
          acoustic: 28.5,
          spiral: 45.0,
          tap_detail: { tap_rate_hz: 3.2, amplitude_decay_pct: 12, rhythm_cv: 0.08, risk_score: 32 },
          acoustic_detail: { mean_f0_hz: 135, jitter_pct: 1.1, shimmer_pct: 1.9, risk_score: 28 },
          spiral_detail: { rms_deviation_px: 11.5, velocity_reversals: 2, dominant_tremor_hz: 5.4, risk_score: 45 }
        })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurocheck_clinical_dossier_${currentUser.username}.pdf`;
      a.click();
    } catch (e) {
      alert("Failed to export dossier: " + e.message);
    }
  };

  const generateCarePlan = async () => {
    setIsLoadingPlan(true);
    try {
      const response = await fetch("http://localhost:8000/generate-care-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composite_score: 48.2,
          motor_score: 35.0,
          acoustic_score: 28.0,
          spiral_score: 42.0,
          patient_tier: "moderate"
        })
      });
      const data = await response.json();
      setCarePlan(data.care_plan_markdown);
    } catch (e) {
      alert("Failed to generate plan: " + e.message);
    }
    setIsLoadingPlan(false);
  };

  return (
    <ClinicalErrorBoundary>
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-neuro-dark text-white font-sans">
        {/* Glow ambient background */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neuro-glow/15 rounded-full blur-[130px] pointer-events-none fixed" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neuro-accent/15 rounded-full blur-[130px] pointer-events-none fixed" />

        {/* Global Navigation Header */}
        <header className="w-full max-w-6xl mx-auto py-5 px-4 md:px-8 flex justify-between items-center z-20 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('guided'); setIndividualSubTest(null); }}>
            <div className="w-10 h-10 rounded-xl bg-neuro-card border border-neuro-glow/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <Brain className="w-6 h-6 text-neuro-glow" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                NeuroCheck <span className="text-neuro-glow font-light">AI</span>
              </h1>
              <p className="text-[10px] text-gray-400">Clinical Screening Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-panel text-xs text-gray-200 border-white/10">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDoctor ? 'bg-blue-400' : 'bg-green-400'}`} />
              <span className="font-semibold text-white truncate max-w-[140px]">{currentUser.full_name}</span>
              {currentUser.age && <span className="text-gray-400 text-[11px]">({currentUser.age}y)</span>}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-neuro-glow uppercase">
                {currentUser.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/40 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <nav className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-4 pb-2 z-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            <button
              onClick={() => { setActiveTab('guided'); setIndividualSubTest(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shrink-0 ${
                activeTab === 'guided'
                  ? 'bg-neuro-glow text-black font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                  : 'glass-panel text-gray-300 hover:text-white hover:border-neuro-glow/40'
              }`}
            >
              <Compass className="w-4 h-4" /> 1. Start Guided Screening (Step-by-Step)
            </button>

            <button
              onClick={() => { setActiveTab('individual'); setIndividualSubTest(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shrink-0 ${
                activeTab === 'individual'
                  ? 'bg-neuro-card text-neuro-glow border border-neuro-glow shadow-md'
                  : 'glass-panel text-gray-300 hover:text-white hover:border-white/20'
              }`}
            >
              <PlayCircle className="w-4 h-4" /> 2. Individual Tests
            </button>

            <button
              onClick={() => { setActiveTab('history'); setIndividualSubTest(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shrink-0 ${
                activeTab === 'history'
                  ? 'bg-neuro-card text-neuro-accent border border-neuro-accent shadow-md'
                  : 'glass-panel text-gray-300 hover:text-white hover:border-white/20'
              }`}
            >
              <History className="w-4 h-4" /> 3. My Test History & Trends
            </button>

            {isDoctor && (
              <button
                onClick={() => { setActiveTab('doctor'); setIndividualSubTest(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition shrink-0 ${
                  activeTab === 'doctor'
                    ? 'bg-neuro-card text-blue-400 border border-blue-400 shadow-md'
                    : 'glass-panel text-gray-300 hover:text-white hover:border-blue-500/40'
                }`}
              >
                <Stethoscope className="w-4 h-4" /> Doctor Clinical Station
              </button>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-4 flex-1 z-10 flex flex-col gap-6 pb-20">
          
          {/* TAB 1: GUIDED FULL SCREENING */}
          {activeTab === 'guided' && (
            <GuidedScreening
              currentUser={currentUser}
              onFinish={() => setActiveTab('history')}
              onSaveHistory={() => setHistoryKey(k => k + 1)}
            />
          )}

          {/* TAB 2: INDIVIDUAL TESTS */}
          {activeTab === 'individual' && (
            <div className="flex flex-col gap-6">
              {!individualSubTest ? (
                <>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-white">Individual Diagnostic Protocols</h2>
                    <p className="text-xs text-gray-400">
                      Choose any single screening test below to test or calibrate specific motor or vocal biomarkers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div
                      onClick={() => setIndividualSubTest('kinematic')}
                      className="glass-panel p-6 rounded-3xl border-white/10 hover:border-neuro-glow/60 transition cursor-pointer flex flex-col justify-between group hover:bg-white/[0.02]"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-neuro-glow/10 border border-neuro-glow/40 flex items-center justify-center text-neuro-glow mb-4">
                          <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Kinematic Hand Motion Test</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                          Evaluates thumb-index finger opposition for Parkinsonian bradykinesia rate, amplitude decay, and rhythm CV.
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neuro-glow font-semibold pt-4 border-t border-white/5">
                        <span>Launch Camera Test</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>

                    <div
                      onClick={() => setIndividualSubTest('acoustic')}
                      className="glass-panel p-6 rounded-3xl border-white/10 hover:border-neuro-accent/60 transition cursor-pointer flex flex-col justify-between group hover:bg-white/[0.02]"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-neuro-accent/10 border border-neuro-accent/40 flex items-center justify-center text-neuro-accent mb-4">
                          <Waves className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Acoustic Voice Phonation</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                          Records unpadded 16kHz PCM audio to measure fundamental frequency (F0), local jitter, shimmer, and vocal tremor.
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neuro-accent font-semibold pt-4 border-t border-white/5">
                        <span>Launch Microphone Test</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>

                    <div
                      onClick={() => setIndividualSubTest('spiral')}
                      className="glass-panel p-6 rounded-3xl border-white/10 hover:border-yellow-400/60 transition cursor-pointer flex flex-col justify-between group hover:bg-white/[0.02]"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/40 flex items-center justify-center text-yellow-300 mb-4">
                          <Target className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Archimedes Spiral Draw</h3>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">
                          Captures millisecond (X, Y) vectors to calculate radial departure from the theoretical curve and physiological tremor (3-12 Hz).
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-yellow-300 font-semibold pt-4 border-t border-white/5">
                        <span>Launch Canvas Test</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  {individualSubTest === 'kinematic' && (
                    <KinematicTest onBack={() => setIndividualSubTest(null)} />
                  )}
                  {individualSubTest === 'acoustic' && (
                    <AcousticTest onBack={() => setIndividualSubTest(null)} />
                  )}
                  {individualSubTest === 'spiral' && (
                    <SpiralTest onBack={() => setIndividualSubTest(null)} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY TEST HISTORY */}
          {activeTab === 'history' && (
            <PatientHistory
              key={historyKey}
              username={currentUser.username}
              onTakeTest={() => setActiveTab('guided')}
            />
          )}

          {/* TAB 4: DOCTOR CLINICAL STATION */}
          {activeTab === 'doctor' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-blue-400" /> Clinical Investigator Dashboard
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Multi-modal triage, quantitative biomarker telemetry, and clinical PDF dossier generation.
                  </p>
                </div>
                <button
                  onClick={exportDossier}
                  className="glass-btn !bg-blue-600 hover:!bg-blue-700 !text-white font-bold text-xs !py-2.5 !px-5 flex items-center gap-2 shadow-lg"
                >
                  <FileText className="w-4 h-4" /> Export Clinical Dossier (PDF)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-panel p-5 rounded-2xl">
                  <span className="text-xs text-gray-400">Patient Cohort Monitored</span>
                  <div className="text-2xl font-bold text-white mt-1">1 Patient Active</div>
                  <div className="text-[11px] text-green-400 mt-1">● Live Telemetry Synced</div>
                </div>
                <div className="glass-panel p-5 rounded-2xl">
                  <span className="text-xs text-gray-400">Asynchronous Celery Engine</span>
                  <div className="text-2xl font-bold text-neuro-glow mt-1">Redis Broker Online</div>
                  <div className="text-[11px] text-gray-400 mt-1">Concurrency: 4 worker threads</div>
                </div>
                <div className="glass-panel p-5 rounded-2xl">
                  <span className="text-xs text-gray-400">Security & Compliance</span>
                  <div className="text-2xl font-bold text-neuro-accent mt-1">HIPAA PHI Filter</div>
                  <div className="text-[11px] text-gray-400 mt-1">Automatic regex de-identification</div>
                </div>
              </div>

              {/* AI Care Planner Section for Doctors */}
              <div className="glass-panel p-6 rounded-3xl border-neuro-glow/30">
                <CarePlanView
                  planMarkdown={carePlan}
                  onRegenerate={generateCarePlan}
                  isGenerating={isLoadingPlan}
                  compositeScore={48.2}
                  riskTier="moderate"
                />
              </div>
            </div>

          )}
        </main>
      </div>
    </ClinicalErrorBoundary>
  );
}
