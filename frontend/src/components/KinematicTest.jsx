import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { ArrowLeft, Activity, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import ClinicalErrorBoundary from './ClinicalErrorBoundary';
import TaskStatusMonitor from './TaskStatusMonitor';

export default function KinematicTest({ onBack, onResult }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fps, setFps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [taskId, setTaskId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const stateRef = useRef({
    capturing: false,
    frames: [],
    taps: [],
    lastDist: 100,
    startTime: 0,
    lastFpsTime: 0,
    droppedFrames: 0
  });

  useEffect(() => {
    let handLandmarker = null;
    let animationFrameId = null;
    let isMounted = true;

    const initializeMediaPipe = async () => {
      try {
        // Try local WASM bundle first, then fallback to CDN
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('/mediapipe');
        } catch (_) {
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
        }

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (isMounted) {
          setIsLoaded(true);
          predict();
        }
      } catch (err) {
        if (isMounted) {
          setError(`Edge Vision Initialization Error: ${err.message}`);
        }
      }
    };

    const predict = () => {
      if (!isMounted) return;

      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState >= 2 &&
        handLandmarker
      ) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;

        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          const now = performance.now();
          const delta = now - stateRef.current.lastFpsTime;
          if (delta > 0) {
            setFps(Math.round(1000 / delta));
          }
          stateRef.current.lastFpsTime = now;

          try {
            const results = handLandmarker.detectForVideo(video, now);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0];
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];

              ctx.beginPath();
              ctx.moveTo(thumbTip.x * canvas.width, thumbTip.y * canvas.height);
              ctx.lineTo(indexTip.x * canvas.width, indexTip.y * canvas.height);
              ctx.strokeStyle = stateRef.current.capturing ? '#FF0055' : '#00F0FF';
              ctx.lineWidth = 4;
              ctx.stroke();

              // Euclidean distance in normalized space
              const dist = Math.round(
                Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)) * 100
              );
              setDistance(dist);

              if (stateRef.current.capturing) {
                const elapsedMs = now - stateRef.current.startTime;
                
                // Record Kinematic coordinate frame
                stateRef.current.frames.push({
                  timestampMs: parseFloat(elapsedMs.toFixed(2)),
                  landmarks: [landmarks.map(p => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }))],
                  handedness: ['Right'],
                  fps: 30.0
                });

                // Tap detection
                if (dist < 4 && stateRef.current.lastDist >= 4) {
                  const zone = stateRef.current.taps.length % 2 === 0 ? 'A' : 'B';
                  stateRef.current.taps.push({ zone, t_ms: elapsedMs });
                }
                stateRef.current.lastDist = dist;
              }
            }
          } catch (e) {
            stateRef.current.droppedFrames += 1;
          }
        }
      }
      animationFrameId = requestAnimationFrame(predict);
    };

    initializeMediaPipe();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, []);

  const startCapture = () => {
    setIsCapturing(true);
    setResult(null);
    setTaskId(null);
    setTimeLeft(10);
    stateRef.current.capturing = true;
    stateRef.current.frames = [];
    stateRef.current.taps = [];
    stateRef.current.startTime = performance.now();
    stateRef.current.droppedFrames = 0;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finishCapture();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const finishCapture = async () => {
    setIsCapturing(false);
    stateRef.current.capturing = false;

    const capturedFrames = stateRef.current.frames;
    const capturedTaps = stateRef.current.taps;

    // Asynchronous Dispatch to Screening Engine
    try {
      const payload = {
        patient_id: 'SUBJECT_ANON_SESSION',
        duration_ms: 10000.0,
        average_fps: 30.0,
        series: capturedFrames
      };

      const res = await fetch('http://localhost:8000/api/v1/screening/tremor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setTaskId(data.task_id);
      } else {
        // Fallback to direct tap endpoint
        fallbackSyncTap(capturedTaps);
      }
    } catch (_) {
      fallbackSyncTap(capturedTaps);
    }
  };

  const fallbackSyncTap = async (taps) => {
    if (taps.length < 4) {
      alert('Capture complete, but fewer than 4 taps detected. Please keep fingers in frame and repeat.');
      return;
    }
    try {
      const resp = await fetch('http://localhost:8000/analyze/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: taps })
      });
      const data = await resp.json();
      setResult({
        dominant_frequency_hz: data.tap_rate_hz,
        spectral_power: 0.04,
        clinical_classification: 'Bradykinesia Tap Rhythm Evaluated',
        risk_score: data.risk_score,
        care_engine_notes: `Tap rate: ${data.tap_rate_hz} Hz with ${data.amplitude_decay_pct}% amplitude decrement.`
      });
      if (onResult) onResult(data.risk_score, data);
    } catch (e) {
      setError(`Analysis Error: ${e.message}`);
    }
  };

  const handleTaskComplete = (taskResult) => {
    setResult(taskResult);
    if (onResult && taskResult.risk_score !== undefined) {
      onResult(taskResult.risk_score, taskResult);
    }
  };

  return (
    <ClinicalErrorBoundary fallbackTitle="Hand Landmarker Vision Pipeline Interrupted">
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-4xl flex justify-between items-center mb-6">
          <button onClick={onBack} className="glass-btn flex items-center gap-2 !px-4 !py-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-neuro-glow animate-pulse" />
            <h2 className="text-xl font-bold">Kinematic Hand & Tap Analysis</h2>
          </div>
        </div>

        <div className="relative glass-panel rounded-3xl overflow-hidden w-full max-w-4xl aspect-video border-neuro-glow/50">
          {!isLoaded && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neuro-dark/80 z-20 gap-2">
              <div className="text-neuro-glow animate-pulse font-medium">Initializing Local WebAssembly Vision Model...</div>
              <div className="text-xs text-gray-400">Loading MediaPipe GPU pipeline</div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neuro-dark/95 z-40 p-6 text-center text-red-400">
              <AlertTriangle className="w-12 h-12 mb-3" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {taskId && !result ? (
            <div className="absolute inset-0 z-40 bg-neuro-dark/95 flex flex-col items-center justify-center p-8">
              <TaskStatusMonitor taskId={taskId} onComplete={handleTaskComplete} />
            </div>
          ) : result ? (
            <div className="absolute inset-0 z-40 bg-neuro-dark/95 flex flex-col items-center justify-center p-8 overflow-y-auto">
              <CheckCircle2 className="w-14 h-14 text-green-400 mb-3" />
              <h3 className="text-2xl font-bold mb-4">Kinematic Screening Complete</h3>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-4">
                <div className="glass-panel p-4 rounded-xl text-center">
                  <p className="text-gray-400 text-xs">Tremor / Oscillation Freq</p>
                  <p className="text-2xl font-bold text-neuro-glow">{result.dominant_frequency_hz || result.tap_rate_hz || 0} Hz</p>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <p className="text-gray-400 text-xs">Classification</p>
                  <p className="text-sm font-semibold text-neuro-accent mt-2">{result.clinical_classification || 'Evaluated'}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center col-span-2 border-yellow-500/30">
                  <p className="text-gray-400 text-xs">Motor Risk Score</p>
                  <p className="text-3xl font-bold text-yellow-400">{result.risk_score || 0} / 100</p>
                </div>
              </div>

              {result.care_engine_notes && (
                <div className="p-4 bg-white/5 rounded-xl border border-neuro-glow/30 text-xs text-gray-300 max-w-md text-left flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-neuro-glow shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Clinical Note:</span> {result.care_engine_notes}
                  </div>
                </div>
              )}

              <button onClick={() => { setResult(null); setTaskId(null); }} className="glass-btn mt-6 !px-6">
                Retest Kinematics
              </button>
            </div>
          ) : (
            <>
              <Webcam
                ref={webcamRef}
                mirrored={true}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-10"
                style={{ transform: 'scaleX(-1)' }}
              />

              <div className="absolute top-4 right-4 z-30 px-3 py-1 bg-black/60 rounded-full text-xs font-mono text-gray-300">
                FPS: <span className="text-neuro-glow font-bold">{fps}</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 z-30 flex justify-between items-end">
                <div className="glass-panel !bg-neuro-dark/90 p-4 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Thumb-Index Distance</p>
                  <p className="text-3xl font-bold text-neuro-glow font-mono">
                    {distance} <span className="text-xs text-gray-500">units</span>
                  </p>
                </div>

                {!isCapturing ? (
                  <button
                    onClick={startCapture}
                    disabled={!isLoaded}
                    className="glass-btn !bg-neuro-glow !text-black !font-bold disabled:opacity-50"
                  >
                    Start 10s Capture
                  </button>
                ) : (
                  <div className="glass-panel !bg-red-500/20 border-red-500/50 p-4 rounded-xl text-center min-w-[150px]">
                    <p className="text-xs text-red-200 mb-1">Capturing Kinematics...</p>
                    <p className="text-3xl font-bold text-red-400 font-mono">
                      00:{timeLeft.toString().padStart(2, '0')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ClinicalErrorBoundary>
  );
}
