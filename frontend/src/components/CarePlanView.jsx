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

    const cleanText = planMarkdown
      .replace(/[\*#_]/g, '')
      .replace(/\n\n/g, '. ')
      .replace(/-\s/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
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
      <div className="p-8 rounded-2xl bg-white border border-sky-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
          Synthesizing Personalized 7-Day Neuro-Rehabilitation Plan...
        </p>
        <p className="text-xs text-slate-500 max-w-md">
          Analyzing tap kinematics, voice perturbation, and Archimedes spatial vectors to calibrate exercise intensity.
        </p>
      </div>
    );
  }

  if (!planMarkdown) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <Brain className="w-10 h-10 text-sky-600/60" />
        <h4 className="font-bold text-sm text-slate-900">No Care Plan Synthesized Yet</h4>
        <p className="text-xs text-slate-500 max-w-md">
          Generate an adaptive 7-day physical therapy, vocal stability, and dual-task coordination protocol tailored to your screening metrics.
        </p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="glass-btn !bg-sky-600 hover:!bg-sky-700 !text-white !font-bold text-xs !py-2 !px-4 mt-2 flex items-center gap-2"
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
      <div className="flex flex-wrap justify-between items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              Personalized 7-Day Clinical Regimen
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold">
                Gemini LLM Synthesized
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Calibrated for {riskTier ? riskTier.toUpperCase() : 'SCREENING'} Tier ({compositeScore ? compositeScore.toFixed(0) : '-'}/100)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSpeech}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isSpeaking 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
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
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition shadow-sm"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition shadow-sm"
            title="Print Regimen"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-xs text-sky-700 font-bold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Re-synthesize
            </button>
          )}
        </div>
      </div>

      {/* Formatted Markdown Content */}
      <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans max-h-[500px] overflow-y-auto whitespace-pre-wrap selection:bg-sky-100">
        {planMarkdown}
      </div>

      {/* Safety Notice Footer */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>Clinical Guidance Note: This AI-synthesized care plan provides structured exercise recommendations based on non-invasive biomarkers. Consult your movement disorder specialist before beginning high-intensity drills.</span>
      </div>
    </div>
  );
}
