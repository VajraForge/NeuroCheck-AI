import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TaskStatusMonitor({ taskId, apiBase = "http://localhost:8000", onComplete }) {
  const [status, setStatus] = useState("QUEUED");
  const [step, setStep] = useState("Task dispatched to Celery queue...");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    let isSubscribed = true;
    let pollInterval = null;

    // WebSocket attempt
    const wsUrl = apiBase.replace(/^http/, 'ws') + `/api/v1/tasks/ws/${taskId}`;
    let ws = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);
          setStatus(data.status);
          if (data.meta && data.meta.step) {
            setStep(data.meta.step);
          }
          if (data.status === 'SUCCESS' && data.result) {
            onComplete(data.result);
          } else if (data.status === 'FAILURE') {
            setError(data.error || 'Signal processing task failed');
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        // Fall back to HTTP Polling if WebSocket is not supported or fails
        fallbackPoll();
      };
    } catch (_) {
      fallbackPoll();
    }

    function fallbackPoll() {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        if (!isSubscribed) return;
        try {
          const res = await fetch(`${apiBase}/api/v1/tasks/${taskId}`);
          if (!res.ok) return;
          const data = await res.json();
          setStatus(data.status);
          if (data.meta && data.meta.step) setStep(data.meta.step);
          if (data.status === 'SUCCESS' && data.result) {
            clearInterval(pollInterval);
            onComplete(data.result);
          } else if (data.status === 'FAILURE') {
            clearInterval(pollInterval);
            setError(data.error || 'Signal processing failed');
          }
        } catch (_) {}
      }, 1000);
    }

    return () => {
      isSubscribed = false;
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [taskId, apiBase, onComplete]);

  return (
    <div className="glass-panel p-6 rounded-2xl border-neuro-glow/40 w-full max-w-md mx-auto my-4 text-center">
      {status === 'SUCCESS' ? (
        <div className="flex flex-col items-center gap-2 text-green-400">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
          <h4 className="font-bold text-lg">Signal Processing Complete</h4>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 text-red-400">
          <AlertCircle className="w-10 h-10" />
          <h4 className="font-bold text-lg">Task Failed</h4>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-neuro-glow animate-spin" />
          <h4 className="font-bold text-white text-base">Asynchronous Celery Engine Active</h4>
          <p className="text-xs text-neuro-glow font-mono">{step}</p>
          <div className="text-[10px] text-gray-400 font-mono">Job ID: {taskId}</div>
        </div>
      )}
    </div>
  );
}
