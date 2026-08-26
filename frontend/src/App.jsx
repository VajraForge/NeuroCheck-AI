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
  HelpCircle,
  Zap
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

  const exportDossier = () => {
    window.print();
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
      <div className="min-h-screen bg-[#F8FAFC] bg-med-canvas text-slate-800 font-sans relative overflow-x-hidden flex flex-col items-center">
        {/* Global Hospital-Grade Navigation Header */}
        <header className="w-full max-w-6xl mx-auto py-4 px-4 md:px-8 flex justify-between items-center z-20 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 shadow-sm">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => { setActiveTab('guided'); setIndividualSubTest(null); }}>
            <div className="w-10 h-10 rounded-xl bg-sky-600 border border-sky-500 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  NEUROCHECK <span className="text-sky-600 font-light">AI</span>
                </h1>
                <span className="clinical-badge bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
                  MDS-UPDRS Clinical Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Multimodal Telemetry Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <div className={`w-2 h-2 rounded-full ${isDoctor ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
              <span className="font-semibold text-slate-900 truncate max-w-[130px]">{currentUser.full_name}</span>
              {currentUser.age && <span className="text-slate-500 text-[11px]">({currentUser.age}y)</span>}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white font-mono text-slate-700 border border-slate-200 uppercase font-bold">
                {currentUser.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Segmented Navigation Tabs Bar */}
        <nav className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-5 pb-2 z-10">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => { setActiveTab('guided'); setIndividualSubTest(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition shrink-0 ${
                activeTab === 'guided'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" /> 1. Guided Screening Workflow
            </button>

            <button
              onClick={() => { setActiveTab('individual'); setIndividualSubTest(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition shrink-0 ${
                activeTab === 'individual'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PlayCircle className="w-4 h-4" /> 2. Individual Biomarker Tests
            </button>

            <button
              onClick={() => { setActiveTab('history'); setIndividualSubTest(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition shrink-0 ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" /> 3. Longitudinal Trends
            </button>

            {isDoctor && (
              <button
                onClick={() => { setActiveTab('doctor'); setIndividualSubTest(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition shrink-0 ${
                  activeTab === 'doctor'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50'
                }`}
              >
                <Stethoscope className="w-4 h-4" /> 4. Clinical Investigator Station
              </button>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 z-10 flex-1 flex flex-col">
          {/* TAB 1: GUIDED SCREENING */}
          {activeTab === 'guided' && (
            <GuidedScreening
              currentUser={currentUser}
              onFinish={() => setActiveTab('history')}
              onSaveHistory={() => setHistoryKey(k => k + 1)}
            />
          )}

          {/* TAB 2: INDIVIDUAL SUB-TESTS */}
          {activeTab === 'individual' && (
            <div className="flex flex-col gap-6">
              {!individualSubTest ? (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-sky-600 uppercase tracking-wider font-semibold">Modular Diagnostic Suite</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Isolated Biomarker Calibration</h2>
                    <p className="text-xs text-slate-600">
                      Select an individual test below to benchmark specific motor kinetics, phonation acoustics, or spatial tremors.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div
                      onClick={() => setIndividualSubTest('kinematic')}
                      className="glass-panel p-6 rounded-3xl hover:border-sky-400 transition cursor-pointer flex flex-col justify-between group hover:shadow-md bg-white"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 mb-4 shadow-sm">
                          <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Kinematic Finger-Tap Assay</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          Evaluates thumb-index finger opposition for Parkinsonian bradykinesia rate, amplitude decay (fatigue), and rhythm CV.
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-sky-600 font-semibold pt-4 border-t border-slate-100">
                        <span>Launch Camera Assay</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>

                    <div
                      onClick={() => setIndividualSubTest('acoustic')}
                      className="glass-panel p-6 rounded-3xl hover:border-teal-400 transition cursor-pointer flex flex-col justify-between group hover:shadow-md bg-white"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-4 shadow-sm">
                          <Waves className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Acoustic Phonation Assay</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          Records 16kHz PCM audio to measure fundamental frequency (F0), local jitter perturbations, shimmer, and vocal tremor.
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-teal-600 font-semibold pt-4 border-t border-slate-100">
                        <span>Launch Microphone Assay</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>

                    <div
                      onClick={() => setIndividualSubTest('spiral')}
                      className="glass-panel p-6 rounded-3xl hover:border-amber-400 transition cursor-pointer flex flex-col justify-between group hover:shadow-md bg-white"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                          <Target className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Archimedes Spiral Draw</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          Captures millisecond (X, Y) vectors to calculate radial departure from the theoretical curve and physiological tremor (3-12 Hz).
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-amber-600 font-semibold pt-4 border-t border-slate-100">
                        <span>Launch Canvas Assay</span>
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
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
                    <Stethoscope className="w-6 h-6 text-indigo-600" /> Clinical Investigator Dashboard
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Multi-modal triage, quantitative biomarker telemetry, and clinical PDF dossier generation.
                  </p>
                </div>
                <button
                  onClick={exportDossier}
                  className="glass-btn !bg-indigo-600 hover:!bg-indigo-700 !text-white font-bold text-xs !py-2.5 !px-5 flex items-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Export Clinical Dossier (PDF)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-panel p-5 bg-white">
                  <span className="text-xs text-slate-500 font-medium">Patient Cohort Monitored</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">1 Active Subject</div>
                  <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Telemetry Synced
                  </div>
                </div>
                <div className="glass-panel p-5 bg-white">
                  <span className="text-xs text-slate-500 font-medium">Asynchronous Inference Engine</span>
                  <div className="text-2xl font-bold text-sky-600 mt-1">Redis Broker Active</div>
                  <div className="text-[11px] text-slate-500 mt-1">Concurrency: 4 worker threads</div>
                </div>
                <div className="glass-panel p-5 bg-white">
                  <span className="text-xs text-slate-500 font-medium">Security & Compliance</span>
                  <div className="text-2xl font-bold text-teal-600 mt-1">HIPAA PHI Filter</div>
                  <div className="text-[11px] text-slate-500 mt-1">Zero-storage regex de-identification</div>
                </div>
              </div>

              {/* AI Care Planner Section for Doctors */}
              <div className="glass-panel p-6 rounded-3xl border-indigo-200 bg-white">
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
