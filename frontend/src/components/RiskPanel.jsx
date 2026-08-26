import React, { useEffect, useState } from "react";
import CarePlanView from "./CarePlanView";
import FacilityFinder from "./FacilityFinder";

const TIER_LABEL = { low: "low risk", moderate: "moderate risk", high: "high risk" };

export default function RiskPanel({ apiBase = "http://localhost:8000", scores, details = {} }) {
  const [risk, setRisk] = useState(null); // { composite, tier }
  const [showFacilities, setShowFacilities] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
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

  const barColor = (v) => (v < 30 ? "var(--teal, #00F0FF)" : v < 65 ? "var(--amber, #FBBF24)" : "var(--red, #EF4444)");

  const generatePlan = async () => {
    if (!risk) return;
    setIsGeneratingPlan(true);
    try {
      const res = await fetch(`${apiBase}/generate-care-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          composite_score: risk.composite,
          motor_score: scores.motor || 30.0,
          acoustic_score: scores.acoustic || 25.0,
          spiral_score: scores.spiral || 35.0,
          patient_tier: risk.tier,
          details: details
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.care_plan_markdown);
      }
    } catch (_) {
    } finally {
      setIsGeneratingPlan(false);
    }
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
          tap_detail: details.tap || details.motor,
          acoustic_detail: details.acoustic,
          spiral_detail: details.spiral,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neurocheck_clinical_dossier.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="risk-panel flex flex-col gap-5 p-6 rounded-3xl glass-panel border-white/10">
      <div className="eyebrow text-xs font-mono text-neuro-glow uppercase">Composite risk stratification</div>
      <div className="risk-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="risk-score-wrap flex items-baseline gap-3">
          <div className="risk-score text-4xl font-bold text-white">
            {risk ? risk.composite.toFixed(0) : "—"}
            <span className="text-sm font-normal text-gray-400">/100</span>
          </div>
          <div
            className="risk-badge text-xs uppercase px-2.5 py-1 rounded-full border font-bold"
            style={
              risk
                ? { color: barColor(risk.composite), borderColor: barColor(risk.composite) }
                : {}
            }
          >
            {risk ? TIER_LABEL[risk.tier] : "awaiting data"}
          </div>
        </div>

        <div className="sub-metrics flex-1 w-full sm:max-w-md flex flex-col gap-2.5">
          {["motor", "acoustic", "spiral"].map((key) => (
            <div key={key}>
              <div className="sub-row flex justify-between text-xs text-gray-300 mb-1">
                <span>{{ motor: "Motor — tap", acoustic: "Acoustic — voice", spiral: "Fine-motor — spiral" }[key]}</span>
                <b>{scores[key] === null ? "—" : `${scores[key].toFixed(0)} / 100`}</b>
              </div>
              <div className="bar-wrap w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bar-fill h-full rounded-full transition-all duration-500"
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

      <div className="actions flex flex-wrap gap-3 pt-2">
        <button
          disabled={!risk}
          onClick={() => setShowFacilities(!showFacilities)}
          className="glass-btn !py-2.5 !px-5 text-xs font-bold !bg-neuro-glow !text-black flex items-center gap-2"
        >
          {showFacilities ? "Hide nearby facilities" : "Find nearby care (GPS)"}
        </button>
        <button
          disabled={!risk || isGeneratingPlan}
          onClick={generatePlan}
          className="glass-btn !py-2.5 !px-5 text-xs font-bold !bg-white/10 hover:!bg-white/20 text-white flex items-center gap-2"
        >
          {isGeneratingPlan ? "Synthesizing AI Plan..." : "Generate AI rehab plan"}
        </button>
        <button
          className="secondary glass-btn !py-2.5 !px-5 text-xs font-bold !bg-blue-600 hover:!bg-blue-700 text-white flex items-center gap-2"
          disabled={!risk || exporting}
          onClick={exportDossier}
        >
          {exporting ? "Building PDF…" : "Export clinical dossier (PDF)"}
        </button>
      </div>

      {showFacilities && risk && (
        <FacilityFinder
          riskTier={risk.tier}
          onClose={() => setShowFacilities(false)}
        />
      )}

      {plan && (
        <CarePlanView
          planMarkdown={plan}
          onRegenerate={generatePlan}
          isGenerating={isGeneratingPlan}
          compositeScore={risk?.composite}
          riskTier={risk?.tier}
        />
      )}

      <div className="note text-[11px] text-gray-400 p-3 rounded-xl bg-black/20 border border-white/5">
        <b>NeuroCheck AI CDS Note:</b> Modality biomarkers are computed using signal processing (FFT spectral power, autocorrelation pitch tracking, and Hilbert envelope). AI care regimens are synthesized dynamically based on patient stratification.
      </div>
    </div>
  );
}

