import React, { useRef, useState } from "react";

export default function TapTest({ apiBase, onResult }) {
  const [status, setStatus] = useState("idle"); // idle | recording | done | error
  const [message, setMessage] = useState("Not started");
  const [metrics, setMetrics] = useState(null);
  const eventsRef = useRef([]);
  const lastZoneRef = useRef(null);
  const startRef = useRef(0);
  const timerRef = useRef(null);

  const start = () => {
    eventsRef.current = [];
    lastZoneRef.current = null;
    startRef.current = performance.now();
    setStatus("recording");
    setMessage("Recording — tap A / B alternately (10s)");
    setMetrics(null);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(finish, 10000);
  };

  const tap = (zone) => {
    if (status !== "recording") return;
    if (zone === lastZoneRef.current) return;
    lastZoneRef.current = zone;
    eventsRef.current.push({ zone, t_ms: performance.now() - startRef.current });
  };

  const finish = async () => {
    setStatus("processing");
    try {
      const res = await fetch(`${apiBase}/analyze/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsRef.current }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      const data = await res.json();
      setMetrics(data);
      setStatus("done");
      setMessage("Test complete");
      onResult(data.risk_score, data);
    } catch (e) {
      setStatus("error");
      setMessage(e.message);
    }
  };

  return (
    <div className="card">
      <div className="eyebrow">Modality 01 — kinematic</div>
      <h2>Finger-tap test</h2>
      <p className="desc">
        Tap the two zones alternately for 10 seconds. Raw timestamps are sent to{" "}
        <code>/analyze/tap</code>, where NumPy computes tap rate and amplitude decay.
      </p>
      <div className="zone-row">
        <button className="zone" onClick={() => tap("A")}>A</button>
        <button className="zone" onClick={() => tap("B")}>B</button>
      </div>
      <button onClick={start} disabled={status === "recording" || status === "processing"}>
        Start test
      </button>
      <div className={`status ${status}`}>
        <span className="pip" />
        {message}
      </div>
      {metrics && (
        <div className="metrics">
          <div className="metric"><span>Tap rate</span><b>{metrics.tap_rate_hz} Hz</b></div>
          <div className="metric"><span>Amplitude decay</span><b>{metrics.amplitude_decay_pct}%</b></div>
          <div className="metric"><span>Rhythm variability</span><b>{metrics.rhythm_cv}</b></div>
        </div>
      )}
    </div>
  );
}
