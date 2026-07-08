import { useState, useRef, useEffect } from "react";

const TOTAL_STEPS = 32;
const SPEEDS = [1, 2, 4];

function fmtHours(steps) {
  const h = String(steps).padStart(2, "0");
  return `${h}:00:00`;
}

// Plain-drawn media-control glyphs — no dedicated play/pause/prev/next
// icons exist in the asset set yet, so simple SVG shapes stand in.
function PlayGlyph() { return <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 0.5 L9 5 L1 9.5 Z" fill="currentColor" /></svg>; }
function PauseGlyph() { return <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="0.5" width="3" height="9" fill="currentColor" /><rect x="6" y="0.5" width="3" height="9" fill="currentColor" /></svg>; }
function StepGlyph({ back }) {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" style={{ transform: back ? "scaleX(-1)" : "none" }}>
      <path d="M0.5 0.5 L7 5 L0.5 9.5 Z" fill="currentColor" />
      <rect x="8.5" y="0.5" width="1.6" height="9" fill="currentColor" />
    </svg>
  );
}

function ControlButton({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        height: 24, minWidth: 24, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--surface-4)" : "var(--surface-1)", border: "1px solid var(--border-primary)",
        borderRadius: 2, cursor: "pointer", color: "var(--text-primary)",
      }}
    >
      {children}
    </button>
  );
}

// Demo-only playback widget (fm-v8.0-anim-player-v2) — no time-varying
// simulation data exists behind this prototype, so play/pause just steps
// `currentStep` through 1..32 on an interval; nothing else on the canvas
// is wired to it yet.
export function GlobalAnimatorBody() {
  const [currentStep, setCurrentStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentStep((s) => (s >= TOTAL_STEPS ? 1 : s + 1));
    }, 500 / SPEEDS[speedIdx]);
    return () => clearInterval(id);
  }, [playing, speedIdx]);

  const stepFromClientX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.max(1, Math.min(TOTAL_STEPS, Math.round(frac * (TOTAL_STEPS - 1)) + 1));
  };
  const onTrackDown = (e) => {
    setCurrentStep(stepFromClientX(e.clientX));
    const onMove = (ev) => setCurrentStep(stepFromClientX(ev.clientX));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 8, padding: 8 }}>
      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 2 }}>
          <ControlButton title="Previous step" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}><StepGlyph back /></ControlButton>
          <ControlButton title={playing ? "Pause" : "Play"} active={playing} onClick={() => setPlaying((p) => !p)}>
            {playing ? <PauseGlyph /> : <PlayGlyph />}
          </ControlButton>
          <ControlButton title="Next step" onClick={() => setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1))}><StepGlyph /></ControlButton>
          <button
            onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
            title="Playback speed"
            style={{
              height: 24, padding: "0 8px", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)",
              background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2, cursor: "pointer",
            }}
          >x{SPEEDS[speedIdx]}</button>
        </div>
        <div style={{ flex: "1 0 0" }} />
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          {fmtHours(currentStep - 1)}/{fmtHours(TOTAL_STEPS)}
        </span>
      </div>

      {/* Timestep ruler */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 6px", flexShrink: 0 }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
          <span key={n} style={{ fontSize: 9, color: n === currentStep ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: n === currentStep ? 600 : 400 }}>{n}</span>
        ))}
      </div>

      {/* Scrubber track */}
      <div style={{ position: "relative", padding: "10px 6px 0", flexShrink: 0 }}>
        <div
          ref={trackRef}
          onMouseDown={onTrackDown}
          title="Drag to scrub"
          style={{ height: 8, borderRadius: 8, background: "var(--surface-4)", position: "relative", cursor: "pointer" }}
        >
          <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "var(--interface-blue-500, #55c7ff)", borderRadius: 8 }} />
        </div>
        <div
          style={{
            position: "absolute", top: -10, left: `${pct}%`, transform: "translateX(-50%)",
            background: "var(--surface-brand)", color: "#fff", fontSize: "var(--fs-xs)", fontWeight: 500,
            borderRadius: 2, padding: "1px 6px", pointerEvents: "none", whiteSpace: "nowrap",
          }}
        >{currentStep}</div>
      </div>

      <div style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>
        Demo playhead — no simulation timesteps behind this prototype yet.
      </div>
    </div>
  );
}
