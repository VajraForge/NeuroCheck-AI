import React, { useEffect, useState } from "react";

const TIER_LABEL = { low: "low risk", moderate: "moderate risk", high: "high risk" };

const FACILITIES = {
  high: [
    { name: "Bangalore Neuro Sciences Institute — Movement Disorders Clinic", meta: "2.1 km · 24/7 · walk-ins" },
    { name: "St. John's Tertiary Neurology Centre", meta: "4.7 km · 24/7 · specialist on call" },
  ],
  moderate: [
    { name: "Manipal Outpatient Neurology", meta: "1.8 km · Mon–Sat 9am–6pm" },
    { name: "Apollo Diagnostics — MRI / EEG Lab", meta: "3.2 km · imaging & workup" },
  ],
  low: [
    { name: "City Wellness Neuro Screening", meta: "1.4 km · preventive monitoring" },
  ],
};

export default function RiskPanel({ apiBase, scores, details }) {
  const [risk, setRisk] = useState(null); // { composite, tier }
  const [showFacilities, setShowFacilities] = useState(false);
  const [plan, setPlan] = useState(null);
  const [exporting, setExporting] = useState(false);

  const anyScore = Object.values(scores).some((v) => v !== null);

  useEffect(() => {
    if (!anyScore) return;
    fetch(`${apiBase}/risk/composite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scores),
    })
      .then((r) => r.json())
      .then(setRisk)
      .catch(() => {});
  }, [scores, anyScore, apiBase]);

  const barColor = (v) => (v < 30 ? "var(--teal)" : v < 65 ? "var(--amber)" : "var(--red)");

  const generatePlan = () => {
    const lines = [];
    if (scores.motor !== null && scores.motor > 35)
      lines.push("- Finger-opposition drills, 3x/day, 2 min per hand — targets bradykinesia");
    if (scores.acoustic !== null && scores.acoustic > 35)
      lines.push("- Sustained-phonation voice exercises, 5 min/day — targets vocal rigidity");
    if (scores.spiral !== null && scores.spiral > 35)
      lines.push("- Controlled large-radius tracing exercises, 5 min/day — targets kinetic tremor");
    if (lines.length === 0) lines.push("- Maintain baseline: general fine-motor and balance activities, 2x/week");
    lines.push("- Fall prevention: clear walkways, grab bars in bathroom, non-slip mats");
    lines.push("- Caregiver note: track gait and tremor frequency week to week");
    setPlan(lines.join("\n"));
  };

  const exportDossier = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${apiBase}/export/dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motor: scores.motor,
          acoustic: scores.acoustic,
          spiral: scores.spiral,
          tap_detail: details.tap,
          acoustic_detail: details.acoustic,
          spiral_detail: details.spiral,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neurocheck_dossier.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="risk-panel">
      <div className="eyebrow">Composite risk stratification</div>
      <div className="risk-header">
        <div className="risk-score-wrap">
          <div className="risk-score">
            {risk ? risk.composite.toFixed(0) : "—"}
            <span>/100</span>
          </div>
          <div
            className="risk-badge"
            style={
              risk
                ? { color: barColor(risk.composite), borderColor: barColor(risk.composite) }
                : {}
            }
          >
            {risk ? TIER_LABEL[risk.tier] : "awaiting data"}
          </div>
        </div>

        <div className="sub-metrics">
          {["motor", "acoustic", "spiral"].map((key) => (
            <div key={key}>
              <div className="sub-row">
                <span>{{ motor: "Motor — tap", acoustic: "Acoustic — voice", spiral: "Fine-motor — spiral" }[key]}</span>
                <b>{scores[key] === null ? "—" : scores[key].toFixed(0)}</b>
              </div>
              <div className="bar-wrap">
                <div
                  className="bar-fill"
                  style={{
                    width: `${scores[key] ?? 0}%`,
                    background: scores[key] !== null ? barColor(scores[key]) : "transparent",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="actions">
        <button disabled={!risk} onClick={() => setShowFacilities(true)}>
          Find nearby care
        </button>
        <button disabled={!risk} onClick={generatePlan}>
          Generate rehab plan
        </button>
        <button className="secondary" disabled={!risk || exporting} onClick={exportDossier}>
          {exporting ? "Building PDF…" : "Export clinical dossier (PDF)"}
        </button>
      </div>

      {showFacilities && risk && (
        <div id="facilities">
          {FACILITIES[risk.tier].map((f) => (
            <div className="fac" key={f.name}>
              <div className="name">{f.name}</div>
              <div className="meta">{f.meta}</div>
            </div>
          ))}
        </div>
      )}

      {plan && (
        <div id="careplan">
          <b>Adaptive care plan</b> — composite risk {risk?.composite.toFixed(0)}/100
          {"\n\n"}
          {plan}
        </div>
      )}

      <div className="note">
        <b>Prototype notes.</b> All modality scores above are computed server-side by
        the FastAPI backend using NumPy/SciPy on the raw signals this page captures.
        Facility listings are static/illustrative. The PDF dossier is generated live
        by ReportLab on the backend.
      </div>
    </div>
  );
}
