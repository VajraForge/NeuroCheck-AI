import React, { useEffect, useState } from 'react';
import { History, Calendar, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { apiGetHistory } from '../utils/api';

export default function PatientHistory({ username, onTakeTest }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const records = await apiGetHistory();
        setHistory(records);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [username]);

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl border-white/10 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-neuro-glow" /> My Screening History & Longitudinal Trends
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Track how your fine motor and acoustic stability evolve over time.
          </p>
        </div>
        <button
          onClick={onTakeTest}
          className="glass-btn !bg-neuro-glow !text-black !font-bold text-xs !py-2 !px-4 flex items-center gap-1.5"
        >
          Take New Screening <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Loading your health history records...</div>
      ) : history.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-white">No Previous Screening Sessions Recorded</h4>
          <p className="text-xs text-gray-400 max-w-sm">
            You haven't completed a saved screening yet. Start your first 3-minute guided test to establish your neurological baseline!
          </p>
          <button
            onClick={onTakeTest}
            className="glass-btn !bg-neuro-glow !text-black !font-bold text-xs !py-2 !px-4 mt-2"
          >
            Start My Baseline Screening
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-semibold">
                <th className="pb-3 px-2">Date & Time</th>
                <th className="pb-3 px-2">Composite Risk</th>
                <th className="pb-3 px-2">Hand Motion</th>
                <th className="pb-3 px-2">Voice Phonation</th>
                <th className="pb-3 px-2">Spiral Precision</th>
                <th className="pb-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {history.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-2 font-mono text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      item.risk_tier === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      item.risk_tier === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {item.composite_score} / 100 ({item.risk_tier})
                    </span>
                  </td>
                  <td className="py-3 px-2">{item.motor_score ? `${item.motor_score}/100` : '—'}</td>
                  <td className="py-3 px-2">{item.acoustic_score ? `${item.acoustic_score}/100` : '—'}</td>
                  <td className="py-3 px-2">{item.spiral_score ? `${item.spiral_score}/100` : '—'}</td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-green-400 text-[11px] font-medium flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evaluated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
