import { useState, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import weirBroadCrested from "../assets/weir/weir-broad-crested.svg";
import weirSharpCrested from "../assets/weir/weir-sharp-crested.svg";
import weirCrump from "../assets/weir/weir-crump.svg";
import weirGeneral from "../assets/weir/weir-general.svg";
import weirNotional from "../assets/weir/weir-notional.svg";

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
// The Weir-type Select's icon swaps to match the chosen type, per the Figma
// "fm-v8-super-weir-alt-2" component (2456:71077) — every variant shown
// there uses its own type glyph rather than one fixed icon.
const WEIR_TYPE_ICON = {
  "Broad Crested Weir": "broadWeir",
  "Crump Weir": "crumpWeir",
  "Flat V Weir": "flatVWeir",
  "Gated Weir": "gatedWeir",
  "General Weir": "generalWeir",
  "Labyrinth Weir": "labyrinthWeir",
  "Notional Weir": "notionalWeir",
  "Sharp Crested Weir": "sharpCrestedWeir",
  "Syphon Weir": "syphonWeir",
};
// Maps every Weir-type option onto the illustrated cross-section Figma
// actually draws — the "2D Weir diagrams" / "Weir illustrations" component
// sets (FMv8.0-1D-Super-Units 2456:69488 / 2681:109011) only cover five
// profiles, so types outside that set fall back to their closest visual
// analogue: Gated Weir reuses the rectangular Broad Crested block, Flat V
// and Labyrinth reuse the sloped Crump profile, and Syphon reuses the
// enclosed, idealised Notional profile.
const WEIR_VARIANT = {
  "Broad Crested Weir": "broad",
  "Gated Weir": "broad",
  "Sharp Crested Weir": "sharp",
  "Crump Weir": "crump",
  "Flat V Weir": "crump",
  "Labyrinth Weir": "crump",
  "General Weir": "general",
  "Notional Weir": "notional",
  "Syphon Weir": "notional",
};
const WEIR_ART = {
  broad: weirBroadCrested,
  sharp: weirSharpCrested,
  crump: weirCrump,
  general: weirGeneral,
  notional: weirNotional,
};
// Every dimension field's [left, top] position, pulled 1:1 from the Figma
// "2D Weir diagrams" component set's per-variant layout — each field is a
// single row (label immediately beside its value, never stacked), matching
// the real drawing. Sharp Crested has no weir length field (its crest
// breadth alone defines the notch), shown as a disabled "N/A", exactly as
// the Figma Sharp variant does.
const WEIR_LAYOUT = {
  broad:    { crestElev: [319, 8], crestBreadth: [571, 8], weirLength: [321, 232], upInv: [36, 232], dsInv: [578, 232], p1: [96, 126],  p2: [612, 126] },
  sharp:    { crestElev: [256, 8], crestBreadth: [459, 8], weirLength: null,       upInv: [36, 232], dsInv: [578, 232], p1: [257, 137], p2: [458, 137] },
  crump:    { crestElev: [253, 8], crestBreadth: [549, 8], weirLength: [321, 232], upInv: [36, 232], dsInv: [578, 232], p1: [96, 126],  p2: [612, 126] },
  general:  { crestElev: [319, 8], crestBreadth: [530, 8], weirLength: [320, 232], upInv: [36, 232], dsInv: [578, 232], p1: [140, 134], p2: [568, 134] },
  notional: { crestElev: [319, 8], crestBreadth: [582, 8], weirLength: [321, 232], upInv: [36, 232], dsInv: [578, 232], p1: [69, 149],  p2: [639, 149] },
};
const CALC_METHODS = ["Fixed", "Variable"];
const CV_METHODS = ["Variable", "Fixed"];

// A labelled input, one per stacked row (Node labels column).
function Field({ label, info, value, onChange, disabled, placeholder, tall, style }) {
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
    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, ...style }}>
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
// `label` renders a "Calc. method"/"Cv method"-style caption above the
// control (Figma's Modular limit and Coefficient panels put a label over
// every field, dropdowns included) — plain <div>, not <label>, so a click
// on the caption doesn't double-fire the button's own click handler.
// `style` sizes the whole control (e.g. `{ flex: "1 0 0" }` to share a row
// evenly with sibling Fields, same convention as Field's own `style` prop);
// `width` only matters for the no-caption Weir-type select, where it's a
// minWidth floor that the icon+text button can still grow past.
function Select({ label, value, icon, options, onChange, width, style }) {
  const [open, setOpen] = useState(false);
  const control = (
    <div style={{ position: "relative", width: "100%", ...(label ? {} : { minWidth: width || 200 }) }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ height: 32, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 6, padding: "0 8px", background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2, fontSize: 14, color: "var(--text-primary)", cursor: "pointer" }}
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
  if (!label) return <div style={style}>{control}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, ...style }}>
      <span style={{ fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{label}</span>
      {control}
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
function Dim({ label, value, onChange, info, style, row, fieldFirst, disabled }) {
  const field = (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      style={{
        width: 84, height: 24, padding: "0 6px", borderRadius: 2,
        background: disabled ? "var(--surface-4)" : "var(--surface-2)",
        border: "1px solid var(--border-primary)",
        fontSize: 12, color: disabled ? "var(--text-tertiary)" : "var(--text-primary)", outline: "none", fontFamily: "inherit",
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
    <div style={{ position: "absolute", display: "flex", alignItems: row ? "center" : "stretch", flexDirection: row ? "row" : "column", gap: row ? 8 : 3, ...style }}>
      {fieldFirst ? <>{field}{labelEl}</> : <>{labelEl}{field}</>}
    </div>
  );
}

// The weir cross-section illustration with its dimension fields, matching
// the "2D Weir diagrams" / "Weir illustrations" spec (FMv8.0-1D-Super-Units
// 2456:69488 / 2681:109011) — the real Figma-exported SVG for whichever
// profile `variant` selects, with every Dim overlay positioned per that
// variant's own layout (see WEIR_LAYOUT above).
function WeirDiagram({ variant, dims, setDims }) {
  const set = (k) => (v) => setDims((d) => ({ ...d, [k]: v }));
  const layout = WEIR_LAYOUT[variant] ?? WEIR_LAYOUT.broad;
  return (
    <div style={{ position: "relative", width: 800, height: 253, flexShrink: 0 }}>
      <img src={WEIR_ART[variant] ?? weirBroadCrested} width={800} height={253} alt="" style={{ display: "block" }} />
      <Dim label="Crest elevation" row value={dims.crestElev} onChange={set("crestElev")} style={{ left: layout.crestElev[0], top: layout.crestElev[1] }} />
      <Dim label="Crest breadth" row value={dims.breadth} onChange={set("breadth")} style={{ left: layout.crestBreadth[0], top: layout.crestBreadth[1] }} />
      {layout.weirLength ? (
        <Dim label="Weir length" info row value={dims.length} onChange={set("length")} style={{ left: layout.weirLength[0], top: layout.weirLength[1] }} />
      ) : (
        <Dim label="Weir length" info row disabled value="N/A" style={{ left: 321, top: 232 }} />
      )}
      <Dim label="(P1)" row value={dims.p1} onChange={set("p1")} style={{ left: layout.p1[0], top: layout.p1[1] }} />
      <Dim label="(P2)" row fieldFirst value={dims.p2} onChange={set("p2")} style={{ left: layout.p2[0], top: layout.p2[1] }} />
      <Dim label="Upstream invert" row fieldFirst value={dims.upInv} onChange={set("upInv")} style={{ left: layout.upInv[0], top: layout.upInv[1] }} />
      <Dim label="Downstream invert" row value={dims.dsInv} onChange={set("dsInv")} style={{ left: layout.dsInv[0], top: layout.dsInv[1] }} />
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
          {[A.dockWindow, A.minimise, A.dock, A.cancel].map((ic, i) => (
            <button
              key={i}
              onClick={i === 3 ? onClose : undefined}
              title={["Pop out", "Minimise", "Dock", "Close"][i]}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", borderRadius: 2 }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon src={ic} size={12} style={{ filter: "brightness(0)", opacity: 0.55 }} />
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
                <Select value={weirType} icon={WEIR_TYPE_ICON[weirType] ?? "broadWeir"} options={WEIR_TYPES} onChange={setWeirType} />
                <WeirDiagram variant={WEIR_VARIANT[weirType] ?? "broad"} dims={dims} setDims={setDims} />
              </div>
            </Panel>

            <div style={{ display: "flex", gap: 16 }}>
              {/* Figma's final form (2988:39215): Modular limit holds only
                  Calc. method + Value if fixed, side by side; Calibration
                  and Discharge actually belong under Coefficient alongside
                  Cv method + Velocity — the two panels were mixed up before. */}
              <Panel title="Modular limit" style={{ width: 256, alignSelf: "flex-start" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <Select label="Calc. method" style={{ flex: "1 0 0" }} value={calcMethod} options={CALC_METHODS} onChange={setCalcMethod} />
                  <Field label="Value if fixed" style={{ flex: "1 0 0" }} value={valueIfFixed} onChange={setValueIfFixed} />
                </div>
              </Panel>
              <Panel title="Coefficient" info style={{ flex: "1 0 0", alignSelf: "flex-start" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <Field label="Calibration" style={{ flex: "1 0 0" }} value={calibration} onChange={setCalibration} />
                  <Field label="Discharge" style={{ flex: "1 0 0" }} value={discharge} onChange={setDischarge} />
                  <Select label="Cv method" style={{ flex: "1 0 0" }} value={cvMethod} options={CV_METHODS} onChange={setCvMethod} />
                  <Field label="Velocity" style={{ flex: "1 0 0" }} value={velocity} onChange={setVelocity} />
                </div>
              </Panel>
              <Panel title="Exponent" style={{ width: 144, alignSelf: "flex-start" }}>
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