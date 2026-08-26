import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Target, CheckCircle2, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import ClinicalErrorBoundary from './ClinicalErrorBoundary';
import TaskStatusMonitor from './TaskStatusMonitor';

export default function SpiralTest({ onBack, onResult, apiBase = "http://localhost:8000" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [result, setResult] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [error, setError] = useState(null);
  
  const stateRef = useRef({
    points: [],
    startTime: 0,
    isPointerDown: false
  });

  const drawIdealSpiral = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 450;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const a = 2.0;
    const b = 6.0;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    
    for (let i = 0; i < 720; i++) {
      const angle = 0.1 * i;
      const r = a + b * angle;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    stateRef.current.points = [];
    setPointCount(0);
  }, []);

  useEffect(() => {
    drawIdealSpiral();
  }, [drawIdealSpiral]);

  const handlePointerDown = (e) => {
    if (result || isAnalyzing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    stateRef.current.isPointerDown = true;
    setIsDrawing(true);

    if (stateRef.current.points.length === 0) {
      stateRef.current.startTime = performance.now();
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 0.5;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    const pt = {
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      pressure: parseFloat(pressure.toFixed(2)),
      timestampMs: parseFloat((performance.now() - stateRef.current.startTime).toFixed(2))
    };
    stateRef.current.points.push(pt);
    setPointCount(stateRef.current.points.length);
  };

  const handlePointerMove = (e) => {
    if (!stateRef.current.isPointerDown || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure || 0.5;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    
    const pt = {
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      pressure: parseFloat(pressure.toFixed(2)),
      timestampMs: parseFloat((performance.now() - stateRef.current.startTime).toFixed(2))
    };
    stateRef.current.points.push(pt);
    setPointCount(stateRef.current.points.length);
  };

  const handlePointerUp = (e) => {
    stateRef.current.isPointerDown = false;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const analyzeDrawing = async () => {
    if (stateRef.current.points.length < 20) {
      alert("Please trace more of the spiral before submitting for analysis.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 500;
    const height = canvas ? canvas.height : 500;

    const payload = {
      patient_id: "SUBJECT_ANON_SESSION",
      width: width,
      height: height,
      duration_ms: performance.now() - stateRef.current.startTime,
      points: stateRef.current.points,
      a: 2.0,
      b: 6.0
    };

    // Try Celery Task Queue first
    try {
      const res = await fetch(`${apiBase}/api/v1/screening/spiral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setTaskId(data.task_id);
      } else {
        fallbackDirectSpiral(payload);
      }
    } catch (_) {
      fallbackDirectSpiral(payload);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fallbackDirectSpiral = async (payload) => {
    try {
      const resp = await fetch(`${apiBase}/analyze/spiral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error("Spiral analysis failed");
      const data = await resp.json();
      handleTaskComplete(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleTaskComplete = (taskResult) => {
    setResult(taskResult);
    if (onResult && taskResult.risk_score !== undefined) {
      onResult(taskResult.risk_score, taskResult);
    }
  };

  const reset = () => {
    setResult(null);
    setTaskId(null);
    setError(null);
    drawIdealSpiral();
  };

  return (
    <ClinicalErrorBoundary fallbackTitle="Spiral Canvas Pipeline Interrupted">
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-4xl flex justify-between items-center mb-6">
          <button onClick={onBack} className="glass-btn flex items-center gap-2 !px-4 !py-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-neuro-glow" />
            <h2 className="text-xl font-bold">Archimedes Spiral Kinematics</h2>
          </div>
        </div>

        <div className="relative glass-panel rounded-3xl w-full max-w-4xl min-h-[460px] border-neuro-glow/50 flex flex-col items-center justify-center p-6 overflow-hidden">
          
          {taskId && !result ? (
            <TaskStatusMonitor taskId={taskId} apiBase={apiBase} onComplete={handleTaskComplete} />
          ) : result ? (
            <div className="flex flex-col items-center justify-center w-full max-w-md">
              <CheckCircle2 className="w-14 h-14 text-green-400 mb-3" />
              <h3 className="text-2xl font-bold mb-4">Spiral Analysis Complete</h3>

              <div className="grid grid-cols-2 gap-4 w-full mb-4">
                <div className="glass-panel p-4 rounded-xl text-center">
                  <p className="text-gray-400 text-xs">RMS Radial Error</p>
                  <p className="text-2xl font-bold text-neuro-glow">{result.rms_deviation_px || result.mean_radial_deviation_px || 0} px</p>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <p className="text-gray-400 text-xs">Tremor Frequency</p>
                  <p className="text-2xl font-bold text-neuro-accent">{result.dominant_tremor_hz || 0} Hz</p>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center col-span-2 border-yellow-500/30">
                  <p className="text-gray-400 text-xs">Fine-Motor Dysmetria Risk</p>
                  <p className="text-3xl font-bold text-yellow-400">{result.risk_score || 35} / 100</p>
                </div>
              </div>

              {result.care_engine_notes && (
                <div className="p-4 bg-white/5 rounded-xl border border-neuro-glow/30 text-xs text-gray-300 w-full text-left flex items-start gap-2 mb-6">
                  <Sparkles className="w-4 h-4 text-neuro-glow shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Clinical Note:</span> {result.care_engine_notes}
                  </div>
                </div>
              )}

              <button onClick={reset} className="glass-btn !px-6">Retest Spiral</button>
            </div>
          ) : (
            <>
              <p className="text-gray-400 mb-2 text-center text-sm">
                Trace the template spiral starting from the center outward at a natural pace.
              </p>
              <div className="text-xs text-gray-500 mb-3 font-mono">
                Logged Coordinate Points: <span className="text-neuro-glow font-bold">{pointCount}</span>
              </div>

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="w-full h-80 relative bg-neuro-dark/60 rounded-2xl overflow-hidden border border-white/10">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair touch-none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </div>
              
              <div className="w-full flex justify-between items-center mt-4">
                <button 
                  className="glass-btn flex items-center gap-2 !px-4 !py-2 text-xs text-gray-400" 
                  onClick={reset}
                >
                  <RotateCcw className="w-4 h-4" /> Clear Canvas
                </button>
                
                <button 
                  className="glass-btn !bg-neuro-glow !text-black !font-bold !px-6 !py-2 text-sm disabled:opacity-50" 
                  onClick={analyzeDrawing}
                  disabled={isAnalyzing || pointCount < 20}
                >
                  {isAnalyzing ? "Submitting..." : "Analyze Spiral Vectors"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ClinicalErrorBoundary>
  );
}
