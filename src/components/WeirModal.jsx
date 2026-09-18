import { useState, useEffect } from "react";
import { A, Icon } from "../assets.jsx";

// 1D Weir unit editor — the form that opens when the top-level "Weir" item
// (Weirs ribbon dropdown, first row) is added to the 1D Network. Matches the
// Figma "fm-v8.0-modal-frame" / "1D Weir unit" spec: Node labels column, Weir
// type panel with the 2D illustration and its dimension fields, then the
// Modular limit / Coefficient / Exponent panels and a Help · Associated
// data… | Cancel · Confirm footer. The node itself is only committed to the
// network when Confirm is pressed; Cancel/Escape discards the drop.

const WEIR_TYPES = [
  "Broad Crested Weir", "Crump Weir", "Flat V Weir", "Gated Weir",
  "General Weir", "Labyrinth Weir", "Notional Weir", "Sharp Crested Weir", "Syphon Weir",
];
const CALC_METHODS = ["Fixed", "Variable"];
const CV_METHODS = ["Variable", "Fixed"];

// A labelled input, one per stacked row (Node labels column).
function Field({ label, info, value, onChange, disabled, placeholder, tall }) {
  const common = {
    width: "100%",
    padding: tall ? "8px" : "0 8px",
    borderRadius: 2,
    background: disabled ? "var(--surface-4)" : "var(--surface-2)",
    border: `1px solid ${disabled ? "var(--border-secondary)" : "var(--border-primary)"}`,
    fontSize: 14,
    color: disabled ? "var(--text-secondary)" : "var(--text-primary)",
    outline: "none",
    fontFamily: "inherit",
    height: tall ? 64 : 32,
    resize: "none",
    boxSizing: "border-box",
  };
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
        {label}
        {info && <Icon src={A.queryLay} size={14} />}
      </span>
      {tall ? (
        <textarea value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} placeholder={placeholder} style={common} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} placeholder={placeholder} style={common} />
      )}
    </label>
  );
}

// Bordered white panel with a floating pill label sitting on its top edge.
function Panel({ title, info, children, style }) {
  return (
    <div style={{ position: "relative", border: "1px solid var(--border-primary)", borderRadius: 4, padding: "26px 12px 12px", background: "var(--surface-1)", ...style }}>
      <div style={{ position: "absolute", top: -9, left: 12, display: "flex", alignItems: "center", gap: 4, background: "var(--surface-1)", padding: "0 4px", fontSize: "var(--fs-s)", fontWeight: 500, color: "var(--text-primary)" }}>
        {title}
        {info && <Icon src={A.queryLay} size={12} />}
      </div>
      {children}
    </div>
  );
}

// Select-style control (button + chevron) with a small popup list.
function Select({ value, icon, options, onChange, width }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ height: 32, minWidth: width || 200, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2, fontSize: 14, color: "var(--text-primary)", cursor: "pointer" }}
      >
        {icon && <Icon src={A[icon]} size={16} />}
        <span style={{ flex: "1 0 0", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        <Icon src={A.keyDown} size={12} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: 34, left: 0, background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2, boxShadow: "0 2px 10px 2px rgba(0,0,0,0.25)", zIndex: 5, minWidth: "100%" }}>
          {options.map((o) => (
            <div
              key={o}
              onMouseDown={() => { onChange?.(o); setOpen(false); }}
              style={{ padding: "6px 10px", fontSize: 14, color: "var(--text-primary)", background: o === value ? "var(--surface-4)" : "transparent", cursor: "pointer", whiteSpace: "nowrap" }}
              onMouseOver={(e) => { e.currentTarget.style.background = o === value ? "var(--surface-4)" : "var(--surface-3)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = o === value ? "var(--surface-4)" : "transparent"; }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Secondary (white + border) / ghost / primary buttons.
function SecBtn({ text, icon, title, onClick, square, join = "none" }) {
  const radius = join === "start" ? "2px 0 0 2px" : join === "end" ? "0 2px 2px 0" : 2;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        height: 32, padding: square ? 8 : "0 12px", display: "flex", alignItems: "center", gap: 6,
        background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: radius,
        cursor: "pointer", fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap",
        marginRight: join === "start" ? -1 : 0,
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface-1)")}
    >
      {icon && <Icon src={A[icon]} size={16} />}
      {!square && text}
    </button>
  );
}

function GhostBtn({ text, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ height: 32, padding: "0 10px", display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap", borderRadius: 2 }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon && <Icon src={A[icon]} size={16} />}
      {text}
    </button>
  );
}

function PrimaryBtn({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ height: 32, padding: "0 20px", display: "flex", alignItems: "center", background: "var(--surface-brand)", border: "none", borderRadius: 2, cursor: "pointer", fontSize: 14, color: "var(--text-invert)", whiteSpace: "nowrap" }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--blue-700)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface-brand)")}
    >
      {text}
    </button>
  );
}

// Compact dimension field positioned over the 2D illustration.
function Dim({ label, value, onChange, info, style, row, fieldFirst }) {
  const field = (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: 84, height: 24, padding: "0 6px", borderRadius: 2,
        background: "var(--surface-2)", border: "1px solid var(--border-primary)",
        fontSize: 12, color: "var(--text-primary)", outline: "none", fontFamily: "inherit",
      }}
    />
  );
  const labelEl = (
    <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
      {label}
      {info && <Icon src={A.queryLay} size={12} />}
    </span>
  );
  return (
    <div style={{ position: "absolute", display: "flex", alignItems: row ? "center" : "stretch", flexDirection: row ? "row" : "column", gap: 3, ...style }}>
      {fieldFirst ? <>{field}{labelEl}</> : <>{labelEl}{field}</>}
    </div>
  );
}

// The broad-crested weir cross-section illustration with its dimension
// fields, matching the "Component2DWeirDiagrams / WeirIllustrations" spec.
function WeirDiagram({ dims, setDims }) {
  const set = (k) => (v) => setDims((d) => ({ ...d, [k]: v }));
  return (
    <div style={{ position: "relative", width: 800, height: 250, flexShrink: 0 }}>
      <svg width="800" height="250" viewBox="0 0 800 250" style={{ display: "block" }}>
        {/* upstream water body */}
        <polygon points="0,80 230,80 230,190 0,190" fill="#cfe2fb" />
        {/* downstream water body */}
        <path d="M600,150 C645,159 705,163 800,160 L800,200 L600,200 Z" fill="#cfe2fb" />
        {/* weir block */}
        <polygon points="205,190 230,120 560,120 585,190" fill="#001e55" />
        {/* crest highlight */}
        <line x1="230" y1="120" x2="560" y2="120" stroke="#0a7dff" strokeWidth="3" />
        {/* bed lines */}
        <line x1="0" y1="190" x2="205" y2="190" stroke="#001e55" strokeWidth="3" />
        <line x1="585" y1="190" x2="800" y2="190" stroke="#001e55" strokeWidth="3" />
        {/* flow nappe over the downstream face */}
        <path d="M560,116 Q582,120 600,150" fill="none" stroke="#468af3" strokeWidth="2" strokeDasharray="4 3" />
        {/* water surfaces */}
        <path d="M0,80 L230,80" stroke="#468af3" strokeWidth="2" />
        <path d="M230,114 L560,114" stroke="#468af3" strokeWidth="1.5" />
        <path d="M600,150 C645,159 705,163 800,160" stroke="#468af3" strokeWidth="2" />
        {/* gauge lines + markers */}
        <line x1="90" y1="80" x2="90" y2="190" stroke="#b1b1b1" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="700" y1="150" x2="700" y2="200" stroke="#b1b1b1" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="90" cy="190" r="4" fill="#0a7dff" />
        <circle cx="700" cy="200" r="4" fill="#0a7dff" />
        {/* crest level projections for P1/P2 */}
        <line x1="75" y1="120" x2="230" y2="120" stroke="#b1b1b1" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="560" y1="120" x2="740" y2="120" stroke="#b1b1b1" strokeWidth="1" strokeDasharray="3 3" />
        {/* P1 head dimension (upstream water -> crest) */}
        <line x1="75" y1="80" x2="75" y2="120" stroke="#0a7dff" strokeWidth="1.5" />
        <line x1="70" y1="80" x2="80" y2="80" stroke="#0a7dff" strokeWidth="1.5" />
        <line x1="70" y1="120" x2="80" y2="120" stroke="#0a7dff" strokeWidth="1.5" />
        {/* P2 head dimension (crest -> downstream water) */}
        <line x1="700" y1="120" x2="700" y2="160" stroke="#0a7dff" strokeWidth="1.5" />
        <line x1="695" y1="120" x2="705" y2="120" stroke="#0a7dff" strokeWidth="1.5" />
        <line x1="695" y1="160" x2="705" y2="160" stroke="#0a7dff" strokeWidth="1.5" />
        {/* crest breadth dimension */}
        <line x1="230" y1="55" x2="560" y2="55" stroke="#0a7dff" strokeWidth="1.5" />
        <polyline points="230,59 238,55 230,51" fill="none" stroke="#0a7dff" strokeWidth="1.5" />
        <polyline points="560,59 552,55 560,51" fill="none" stroke="#0a7dff" strokeWidth="1.5" />
        {/* crest elevation dimension (bed -> crest) */}
        <line x1="330" y1="190" x2="330" y2="120" stroke="#0a7dff" strokeWidth="1.5" />
        <polyline points="334,190 330,182 326,190" fill="none" stroke="#0a7dff" strokeWidth="1.5" />
        <polyline points="334,120 330,128 326,120" fill="none" stroke="#0a7dff" strokeWidth="1.5" />
        {/* weir length dimension along the base */}
        <line x1="185" y1="218" x2="615" y2="218" stroke="#0a7dff" strokeWidth="1.5" />
        <polyline points="185,222 193,218 185,214" fill="none" stroke="#0a7dff" strokeWidth="1.5" />
        <polyline points="615,222 607,218 615,214" fill="none" stroke="#0a7dff" strokeWidth="1.5" />
      </svg>
      <Dim label="Weir length" info value={dims.length} onChange={set("length")} style={{ left: 292, top: 200 }} />
      <Dim label="Crest breadth" value={dims.breadth} onChange={set("breadth")} style={{ left: 578, top: 8 }} />
      <Dim label="Crest elevation" value={dims.crestElev} onChange={set("crestElev")} style={{ left: 268, top: 8 }} />
      <Dim label="(P1)" value={dims.p1} onChange={set("p1")} style={{ left: 20, top: 66 }} />
      <Dim label="(P2)" value={dims.p2} onChange={set("p2")} style={{ left: 612, top: 88 }} />
      <Dim label="Upstream invert" row fieldFirst value={dims.upInv} onChange={set("upInv")} style={{ left: 20, top: 210 }} />
      <Dim label="Downstream invert" row value={dims.dsInv} onChange={set("dsInv")} style={{ right: 20, top: 210 }} />
      <div style={{ position: "absolute", left: 12, top: 160, transform: "rotate(-90deg)", transformOrigin: "0 0", fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>M032</div>
      <div style={{ position: "absolute", left: 784, top: 184, transform: "rotate(-90deg)", transformOrigin: "0 0", fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>M031</div>
    </div>
  );
}

export default function WeirModal({ draft, onConfirm, onClose }) {
  const initial = draft.weirData || {};
  const [weirName, setWeirName] = useState(initial.weirName ?? "Brisbane Weir");
  const [description, setDescription] = useState(initial.description ?? "Revised data for Notional Weir ds of Woodbury Bridge");
  const [upstream, setUpstream] = useState(draft.upstream || initial.upstream || "");
  const [downstream, setDownstream] = useState(draft.downstream || initial.downstream || "");
  const [usRemote, setUsRemote] = useState(initial.usRemote ?? "");
  const [dsRemote, setDsRemote] = useState(initial.dsRemote ?? "");
  const [weirType, setWeirType] = useState(initial.weirType ?? "Broad Crested Weir");
  const [calcMethod, setCalcMethod] = useState(initial.calcMethod ?? "Fixed");
  const [cvMethod, setCvMethod] = useState(initial.cvMethod ?? "Variable");
  const [valueIfFixed, setValueIfFixed] = useState(initial.valueIfFixed ?? "0.700");
  const [calibration, setCalibration] = useState(initial.calibration ?? "0.000");
  const [discharge, setDischarge] = useState(initial.discharge ?? "0.000");
  const [velocity, setVelocity] = useState(initial.velocity ?? "0.000");
  const [dims, setDims] = useState(initial.dims ?? { length: "2.350", breadth: "0.000", crestElev: "1.200", upInv: "0.123", dsInv: "0.123", p1: "1.200", p2: "0.950" });
  const [changeLog, setChangeLog] = useState(initial.changeLog ?? "11:22:33 25/05/25 – SAM: Amendment made on 24 May 2025 based on client feedback");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const confirm = () => onConfirm({
    weirName, description, upstream, downstream, usRemote, dsRemote,
    weirType, calcMethod, cvMethod, valueIfFixed, calibration, discharge, velocity,
    dims, changeLog,
  });

  const x = (draft.worldX ?? 0).toFixed(6);
  const y = (draft.worldY ?? 0).toFixed(6);

  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.3)", zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
          boxShadow: "0 2px 10px 2px rgba(0,0,0,0.25)", padding: 8, width: 1200,
          maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 48px)",
          display: "flex", flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 28, flexShrink: 0 }}>
          <Icon src={A.broadWeir} size={16} />
          <span style={{ flex: "1 0 0", fontSize: 14, fontWeight: 500, color: "var(--text-primary-selected)" }}>1D Weir unit</span>
          {[A.minimise, A.dock, A.queryLay, A.cancel].map((ic, i) => (
            <button
              key={i}
              onClick={i === 3 ? onClose : undefined}
              title={["Minimise", "Maximise", "Help", "Close"][i]}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", borderRadius: 2 }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon src={ic} size={12} />
            </button>
          ))}
        </div>

        {/* form body */}
        <div style={{ display: "flex", gap: 16, paddingTop: 12, overflowY: "auto" }}>
          <Panel title="Node labels" style={{ width: 244, flexShrink: 0, alignSelf: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Weir name*" value={weirName} onChange={setWeirName} placeholder="Brisbane Weir" />
              <Field label="Description*" value={description} onChange={setDescription} placeholder="Revised data for Notional Weir ds of Woodbury Bridge" />
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: "1 0 0", minWidth: 0 }}>
                  <Field label="X co-ordinates" value={x} disabled />
                </div>
                <div style={{ flex: "1 0 0", minWidth: 0 }}>
                  <Field label="Y co-ordinates" value={y} disabled />
                </div>
                <SecBtn icon="generalEdit" title="Edit coordinates" square onClick={() => {}} />
              </div>
              <Field label="Upstream*" value={upstream} onChange={setUpstream} placeholder="M030" />
              <Field label="Downstream*" value={downstream} onChange={setDownstream} placeholder="M031" />
              <Field label="US remote" value={usRemote} onChange={setUsRemote} placeholder="M032" />
              <Field label="DS remote" value={dsRemote} onChange={setDsRemote} placeholder="M033" />
              <Field label="Changelog" info value={changeLog} onChange={setChangeLog} tall />
              <div style={{ display: "flex", gap: 0 }}>
                <SecBtn text="Add comment" join="start" onClick={() => {}} />
                <SecBtn icon="history" title="History" join="end" square onClick={() => {}} />
              </div>
            </div>
          </Panel>

          <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <Panel title="Weir type" style={{ alignSelf: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Select value={weirType} icon="broadWeir" options={WEIR_TYPES} onChange={setWeirType} />
                <WeirDiagram dims={dims} setDims={setDims} />
              </div>
            </Panel>

            <div style={{ display: "flex", gap: 16 }}>
              <Panel title="Modular limit" style={{ width: 232, alignSelf: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Select value={calcMethod} options={CALC_METHODS} onChange={setCalcMethod} width={200} />
                  <Field label="Value if fixed" value={valueIfFixed} onChange={setValueIfFixed} />
                  <Field label="Calibration" value={calibration} onChange={setCalibration} />
                  <Field label="Discharge" value={discharge} onChange={setDischarge} />
                </div>
              </Panel>
              <Panel title="Coefficient" info style={{ flex: "1 0 0", alignSelf: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Select value={cvMethod} options={CV_METHODS} onChange={setCvMethod} width={180} />
                  <Field label="Velocity" value={velocity} onChange={setVelocity} />
                </div>
              </Panel>
              <Panel title="Exponent" style={{ width: 132, alignSelf: "flex-start" }}>
                <Field label="Exponent" disabled value="1.500" />
              </Panel>
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GhostBtn text="Help" icon="queryLay" onClick={() => {}} />
            <SecBtn text="Associated data..." onClick={() => {}} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <SecBtn text="Cancel" onClick={onClose} />
            <PrimaryBtn text="Confirm" onClick={confirm} />
          </div>
        </div>
      </div>
    </div>
  );
}