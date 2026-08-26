import React from 'react';
import { Activity, Waves, Target, BarChart3 } from 'lucide-react';

/**
 * Visualizes Finger-Tap Rate Decay & Rhythm Variability over time
 */
export function TapDecayChart({ tapRate = 3.2, amplitudeDecay = 14, rhythmCv = 0.08 }) {
  // Generate a realistic 10-second time series curve based on actual metrics
  const points = [];
  const totalSeconds = 10;
  const initialSpeed = tapRate * 1.15;
  const decayFactor = (amplitudeDecay / 100) * 0.4;

  for (let s = 0; s <= totalSeconds; s += 0.5) {
    // Speed gradually decays + slight rhythm CV jitter
    const jitter = (Math.sin(s * 3.5) * rhythmCv * 4);
    const speed = Math.max(0.8, (initialSpeed * Math.exp(-decayFactor * (s / totalSeconds))) + jitter);
    points.push({ time: s, speed: parseFloat(speed.toFixed(2)) });
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
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-neuro-glow" /> Tap Kinematics: Fatigue & Decay Curve
        </span>
        <span className="font-mono text-[10px] text-neuro-glow">{amplitudeDecay}% Amplitude Decay</span>
      </div>

      <div className="w-full flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.2)" />

          {/* Area fill */}
          <polygon
            points={`${padding},${height - padding} ${svgPoints} ${width - padding},${height - padding}`}
            fill="url(#tapGlowGradient)"
            opacity="0.25"
          />

          {/* Curve line */}
          <polyline
            points={svgPoints}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start and End Keypoints */}
          {points.length > 0 && (
            <>
              <circle cx={padding} cy={height - padding - ((points[0].speed / maxSpeed) * (height - padding * 2))} r="3.5" fill="#00F0FF" />
              <circle cx={width - padding} cy={height - padding - ((points[points.length - 1].speed / maxSpeed) * (height - padding * 2))} r="3.5" fill="#FF0055" />
            </>
          )}

          <defs>
            <linearGradient id="tapGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
        <span>0s (Baseline: {points[0]?.speed} Hz)</span>
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
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-neuro-accent" /> Phonation Harmonic Stability & Jitter
        </span>
        <span className="font-mono text-[10px] text-neuro-accent">{jitterPct}% Jitter | {shimmerPct}% Shimmer</span>
      </div>

      <div className="h-28 flex items-center justify-between gap-1 px-2 bg-neuro-dark/40 rounded-xl border border-white/5">
        {dataBars.map((val, idx) => (
          <div
            key={idx}
            className="w-full bg-gradient-to-t from-neuro-accent to-neuro-glow rounded-full transition-all duration-300"
            style={{
              height: `${Math.round(val * 100)}%`,
              opacity: 0.5 + val * 0.5
            }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
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
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-white flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-yellow-400" /> FFT Spectral Tremor Decomposition
        </span>
        <span className="font-mono text-[10px] text-yellow-300 font-bold">Peak: {dominantTremorHz} Hz</span>
      </div>

      <div className="w-full flex justify-center relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
          {/* Parkinsonian Diagnostic Zone: 4-7 Hz highlight */}
          <rect
            x={padding + ((4 - 1) / 13) * (width - padding * 2)}
            y={padding}
            width={((3) / 13) * (width - padding * 2)}
            height={height - padding * 2}
            fill="rgba(255, 0, 85, 0.12)"
            rx="4"
          />

          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.2)" />

          {/* Area fill */}
          <polygon
            points={`${padding},${height - padding} ${svgPoints} ${width - padding},${height - padding}`}
            fill="url(#spiralGlowGradient)"
            opacity="0.35"
          />

          {/* Curve */}
          <polyline
            points={svgPoints}
            fill="none"
            stroke="#FBBF24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak Indicator Marker */}
          <circle cx={peakX} cy={height - padding - ((bins.find(b => Math.abs(b.hz - dominantTremorHz) < 0.3)?.power || 0.8) / maxPower) * (height - padding * 2)} r="4.5" fill="#FF0055" stroke="#FFF" strokeWidth="1.5" />

          <defs>
            <linearGradient id="spiralGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
        <span>1 Hz</span>
        <span className="text-red-400 font-bold">? 4–7 Hz (Movement Tremor Zone)</span>
        <span>14 Hz</span>
      </div>
    </div>
  );
}
