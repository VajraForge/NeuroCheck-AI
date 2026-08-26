import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Copy, Check, Printer, ShieldCheck, Play, Square, Volume2 } from 'lucide-react';

export default function CarePlanView({ planMarkdown, onRegenerate, isGenerating = false, compositeScore, riskTier }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    if (!planMarkdown) return;
    navigator.clipboard.writeText(planMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown characters for speech
    const cleanText = planMarkdown
      .replace(/[\*#_]/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/-\s/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Slightly slower for elderly/patients
    utterance.pitch = 1;
    
    // Attempt to use a female or friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // clear any previous
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>NeuroCheck AI - 7-Day Rehabilitation Plan</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f4c81; border-bottom: 2px solid #0f4c81; padding-bottom: 8px; }
            h2, h3 { color: #2c3e50; margin-top: 24px; }
            ul, ol { padding-left: 20px; }
            li { margin-bottom: 6px; }
            hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
            .badge { display: inline-block; padding: 4px 10px; background: #e2f0fd; color: #0b5394; border-radius: 4px; font-weight: bold; font-size: 12px; }
          </style>
        </head>
        <body>
          <div style="white-space: pre-wrap;">${planMarkdown}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (isGenerating) {
    return (
      <div className="p-8 rounded-2xl bg-black/40 border border-neuro-glow/40 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-neuro-glow border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neuro-glow animate-pulse" />
          Synthesizing Personalized 7-Day Neuro-Rehabilitation Plan...
        </p>
        <p className="text-xs text-gray-400 max-w-md">
          Analyzing tap kinematics, voice perturbation, and Archimedes spatial vectors to calibrate exercise intensity.
        </p>
      </div>
    );
  }

  if (!planMarkdown) {
    return (
      <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center gap-3">
        <Brain className="w-10 h-10 text-neuro-glow/60" />
        <h4 className="font-bold text-sm text-white">No Care Plan Synthesized Yet</h4>
        <p className="text-xs text-gray-400 max-w-md">
          Generate an adaptive 7-day physical therapy, vocal stability, and dual-task coordination protocol tailored to your screening metrics.
        </p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="glass-btn !bg-neuro-glow !text-black !font-bold text-xs !py-2 !px-4 mt-2 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Synthesize AI Care Plan
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 p-3.5 bg-neuro-card/80 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neuro-glow/10 border border-neuro-glow/40 flex items-center justify-center text-neuro-glow">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Personalized 7-Day Clinical Regimen
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neuro-glow/20 text-neuro-glow border border-neuro-glow/30 font-mono">
                AI Synthesized
              </span>
            </div>
            <div className="text-[10px] text-gray-400">
              Calibrated for {riskTier ? riskTier.toUpperCase() : 'SCREENING'} Tier ({compositeScore ? compositeScore.toFixed(0) : '-'}/100)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isSpeaking 
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30'
            }`}
            title={isSpeaking ? "Stop Reading" : "Read Aloud"}
          >
            {isSpeaking ? (
              <><Square className="w-3.5 h-3.5 fill-current" /> Stop</>
            ) : (
              <><Volume2 className="w-3.5 h-3.5" /> Read Aloud</>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg glass-panel text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg glass-panel text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition"
            title="Print Regimen"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-3 py-1.5 rounded-lg bg-neuro-glow/20 hover:bg-neuro-glow/30 border border-neuro-glow/40 text-xs text-neuro-glow font-bold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Re-synthesize
            </button>
          )}
        </div>
      </div>

      {/* Formatted Markdown Content */}
      <div className="bg-black/60 p-5 md:p-6 rounded-2xl border border-white/10 text-xs text-gray-200 leading-relaxed font-sans max-h-[500px] overflow-y-auto whitespace-pre-wrap selection:bg-neuro-glow selection:text-black">
        {planMarkdown}
      </div>

      {/* Safety Notice Footer */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-400">
        <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
        <span>Clinical Guidance Note: This AI-synthesized care plan provides structured exercise recommendations based on non-invasive biomarkers. Consult your movement disorder specialist before beginning high-intensity drills.</span>
      </div>
    </div>
  );
}
