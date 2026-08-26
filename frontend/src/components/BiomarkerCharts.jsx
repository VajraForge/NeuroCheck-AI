import React from 'react';
import { Activity, Waves, Target } from 'lucide-react';

/**
 * Visualizes Finger-Tap Rate Decay and Fatigue Curve (Kinematic Test)
 */
export function TapDecayChart({ tapRate = 3.2, amplitudeDecay = 12, rhythmCv = 0.08 }) {
  // Generate simulated decay points over 10 seconds
  const totalSeconds = 10;
  const points = [];
  const startSpeed = tapRate * 1.15;
  const endSpeed = tapRate * (1 - (amplitudeDecay / 100));

  for (let s = 0; s <= totalSeconds; s += 1) {
    const decayFactor = (s / totalSeconds);
    const speed = startSpeed - (startSpeed - endSpeed) * decayFactor + (Math.sin(s * 1.5) * (rhythmCv * 2));
    points.push({ s, speed: Math.max(0.5, parseFloat(speed.toFixed(2))) });
  }

  const maxSpeed = Math.max(...points.map(p => p.speed), 4.5);
  const width = 360;
  const height = 120;
  const padding = 25;

  const svgPoints = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.speed / maxSpeed) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-600" /> Tap Kinematics: Fatigue Curve
        </span>
        <span className="font-mono text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{amplitudeDecay}% Fatigue Decay</span>
      </div>

      <div className="w-full flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#CBD5E1" />

          {/* Area fill */}
          <polygon
            points={`${padding},${height - padding} ${svgPoints} ${width - padding},${height - padding}`}
            fill="url(#tapLightGradient)"
            opacity="0.25"
          />

          {/* Curve line */}
          <polyline
            points={svgPoints}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start and End Keypoints */}
          {points.length > 0 && (
            <>
              <circle cx={padding} cy={height - padding - ((points[0].speed / maxSpeed) * (height - padding * 2))} r="4" fill="#0284C7" stroke="#FFF" strokeWidth="1.5" />
              <circle cx={width - padding} cy={height - padding - ((points[points.length - 1].speed / maxSpeed) * (height - padding * 2))} r="4" fill="#E11D48" stroke="#FFF" strokeWidth="1.5" />
            </>
          )}

          <defs>
            <linearGradient id="tapLightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>0s (Init: {points[0]?.speed} Hz)</span>
        <span>5s</span>
        <span>10s (Fatigue: {points[points.length - 1]?.speed} Hz)</span>
      </div>
    </div>
  );
}

/**
 * Visualizes Voice Phonation Fundamental Frequency & Jitter Stability
 */
export function AcousticWaveformChart({ meanF0 = 135, jitterPct = 1.1, shimmerPct = 1.9 }) {
  const bars = 28;
  const dataBars = Array.from({ length: bars }, (_, i) => {
    const angle = (i / bars) * Math.PI * 4;
    const baseAmp = Math.sin(angle) * 0.4 + 0.5;
    const jitterNoise = (Math.random() - 0.5) * (jitterPct / 2.5);
    return Math.max(0.15, Math.min(0.95, baseAmp + jitterNoise));
  });

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-teal-600" /> Phonation Harmonic Stability
        </span>
        <span className="font-mono text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{jitterPct}% Jitter | {shimmerPct}% Shimmer</span>
      </div>

      <div className="h-28 flex items-center justify-between gap-1 px-2 bg-slate-50 rounded-xl border border-slate-200">
        {dataBars.map((val, idx) => (
          <div
            key={idx}
            className="w-full bg-gradient-to-t from-teal-500 to-sky-400 rounded-full transition-all duration-300"
            style={{
              height: `${Math.round(val * 100)}%`,
              opacity: 0.65 + val * 0.35
            }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>Mean F0: {meanF0.toFixed(0)} Hz</span>
        <span>Glottal Harmonic Profile</span>
        <span>HNR: {(20 - jitterPct * 2).toFixed(1)} dB</span>
      </div>
    </div>
  );
}

/**
 * Visualizes Spiral Tremor FFT Power Spectrum Peak
 */
export function SpiralTremorSpectrumChart({ dominantTremorHz = 5.4, rmsDevPx = 11.5, reversals = 2 }) {
  // Generate FFT frequency bins from 1 to 14 Hz
  const bins = [];
  for (let hz = 1; hz <= 14; hz += 0.5) {
    // Gaussian peak around dominant tremor frequency
    const dist = Math.abs(hz - dominantTremorHz);
    const power = Math.exp(-(dist * dist) / 1.5) * (rmsDevPx / 15);
    const noise = Math.random() * 0.05;
    bins.push({ hz, power: Math.max(0.04, power + noise) });
  }

  const maxPower = Math.max(...bins.map(b => b.power), 1.2);
  const width = 360;
  const height = 120;
  const padding = 25;

  const svgPoints = bins.map((b, idx) => {
    const x = padding + (idx / (bins.length - 1)) * (width - padding * 2);
    const y = height - padding - ((b.power / maxPower) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  const peakX = padding + ((dominantTremorHz - 1) / 13) * (width - padding * 2);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-600" /> FFT Spectral Tremor Spectrum
        </span>
        <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Peak: {dominantTremorHz} Hz</span>
      </div>

      <div className="w-full flex justify-center relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
          {/* Parkinsonian Diagnostic Zone: 4-7 Hz highlight */}
          <rect
            x={padding + ((4 - 1) / 13) * (width - padding * 2)}
            y={padding}
            width={((3) / 13) * (width - padding * 2)}
            height={height - padding * 2}
            fill="rgba(225, 29, 72, 0.08)"
            rx="4"
          />

          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#CBD5E1" />

          {/* Area fill */}
          <polygon
            points={`${padding},${height - padding} ${svgPoints} ${width - padding},${height - padding}`}
            fill="url(#spiralLightGradient)"
            opacity="0.25"
          />

          {/* Curve */}
          <polyline
            points={svgPoints}
            fill="none"
            stroke="#D97706"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak Indicator Marker */}
          <circle cx={peakX} cy={height - padding - ((bins.find(b => Math.abs(b.hz - dominantTremorHz) < 0.3)?.power || 0.8) / maxPower) * (height - padding * 2)} r="4.5" fill="#E11D48" stroke="#FFF" strokeWidth="1.5" />

          <defs>
            <linearGradient id="spiralLightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>1 Hz</span>
        <span className="text-rose-600 font-semibold">● 4-7 Hz (Tremor Zone)</span>
        <span>14 Hz</span>
      </div>
    </div>
  );
}
