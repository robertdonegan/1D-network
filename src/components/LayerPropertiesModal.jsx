import { useEffect, useMemo, useRef, useState } from "react";
import { A, Icon } from "../assets.jsx";

// Layer Properties (Figma "fm-v8-layer-properties-raster-dtm", node
// 6412:74118 — userflow at 6385-68140): right-click ▸ Properties on a
// Layers-panel layer or a 2D result opens this, with left-hand vertical
// tabs (General/Symbology/Labels/Metadata). Only Symbology is wired to real
// behaviour — picking a predefined colour ramp, editing its step table, and
// a live preview swatch — matching this task's scope; the other tabs are
// read-only/placeholder, same "visually present, not all wired" convention
// as the rest of the app (see ModeRibbon's not-yet-built dropdowns).

function hashStr(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return (x >>> 0) / 4294967295;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

// Predefined colour ramps — approximations of the well-known scientific
// palettes (exact hue science isn't the point here, recognisability is).
// Turbo's stops are lifted straight from the Figma "Colour ramp" gradient.
export const PRESET_RAMPS = [
  { id: "turbo", name: "Turbo", stops: [[0, "#3B2E7E"], [0.159, "#4097FE"], [0.332, "#4FF97B"], [0.495, "#E8D638"], [0.663, "#FC8825"], [0.827, "#CD2D04"], [1, "#7F0502"]] },
  { id: "viridis", name: "Viridis", stops: [[0, "#440154"], [0.25, "#3B528B"], [0.5, "#21908C"], [0.75, "#5DC963"], [1, "#FDE725"]] },
  { id: "plasma", name: "Plasma", stops: [[0, "#0D0887"], [0.25, "#7E03A8"], [0.5, "#CC4778"], [0.75, "#F89441"], [1, "#F0F921"]] },
  { id: "spectral", name: "Spectral", stops: [[0, "#9E0142"], [0.2, "#D53E4F"], [0.4, "#FDAE61"], [0.5, "#FFFFBF"], [0.6, "#ABDDA4"], [0.8, "#3288BD"], [1, "#5E4FA2"]] },
  { id: "blues", name: "Blues", stops: [[0, "#F7FBFF"], [0.25, "#C6DBEF"], [0.5, "#6BAED6"], [0.75, "#2171B5"], [1, "#08306B"]] },
];

export function sampleRamp(stops, t) {
  const tc = Math.min(1, Math.max(0, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i], [p1, c1] = stops[i + 1];
    if (tc >= p0 && tc <= p1) {
      const local = p1 === p0 ? 0 : (tc - p0) / (p1 - p0);
      const rgb0 = hexToRgb(c0), rgb1 = hexToRgb(c1);
      return rgbToHex(rgb0.map((v, i2) => v + (rgb1[i2] - v) * local));
    }
  }
  return stops[stops.length - 1][1];
}

export function rampCss(stops) {
  return `linear-gradient(90deg, ${stops.map(([p, c]) => `${c} ${(p * 100).toFixed(2)}%`).join(", ")})`;
}

// Flips which colour sits at which stop position, keeping the original
// spacing — cheap and visually correct enough for a "Reverse" button.
function reverseColors(stops) {
  const colors = stops.map(([, c]) => c).reverse();
  return stops.map(([p], i) => [p, colors[i]]);
}

function buildSteps(stops, count, min, max) {
  const n = Math.max(2, Math.min(20, count));
  const out = [];
  for (let i = 0; i < n; i++) {
    const frac = n === 1 ? 1 : 1 - i / (n - 1); // top row = max, matches the Figma table order
    const value = Math.round((min + frac * (max - min)) * 100) / 100;
    out.push({ id: `s${i}`, value, label: String(value), color: sampleRamp(stops, frac), on: true });
  }
  return out;
}

// Small "what this ramp looks like on real data" swatch — a handful of
// blurred blobs sampled from the ramp at positions seeded off the target's
// id, same deterministic-fake-data spirit as GlobalAnimatorFooter's
// waveform and LongSectionModal's station stats. Recomputes on every ramp
// edit, so it doubles as the live preview the design calls for.
// Coarse random grid + bilinear sampling ("value noise") — cheap stand-in
// for Perlin noise, smooth enough at this preview size. Exported alongside
// terrainHeight so GisCanvas's map-rendered depth raster and this panel's
// preview swatch draw off the same generator.
export function makeNoiseGrid(seedId, salt, cells) {
  const g = [];
  for (let y = 0; y <= cells; y++) {
    const row = [];
    for (let x = 0; x <= cells; x++) row.push(hashStr(`${seedId}-${salt}-${x}-${y}`));
    g.push(row);
  }
  return g;
}
function sampleGrid(grid, u, v) {
  const cells = grid.length - 1;
  const fx = Math.min(cells, Math.max(0, u * cells)), fy = Math.min(cells, Math.max(0, v * cells));
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(cells, x0 + 1), y1 = Math.min(cells, y0 + 1);
  const tx = fx - x0, ty = fy - y0;
  const lerp = (a, b, t) => a + (b - a) * t;
  return lerp(lerp(grid[y0][x0], grid[y0][x1], tx), lerp(grid[y1][x0], grid[y1][x1], tx), ty);
}

// A believable DTM segment: an overall diagonal slope (the hillside) with a
// carved valley band cutting across it, plus fine value-noise for texture —
// not scientifically simulated terrain, just enough visual structure to
// read as "elevation data" rather than random blobs. Height is 0..1 and
// gets fed straight into sampleRamp, so the preview always reflects
// whatever ramp/steps are currently selected.
export function terrainHeight(u, v, seed, fineGrid) {
  const angle = 0.3 + seed("angle") * 0.9;
  const slope = u * Math.cos(angle) + v * Math.sin(angle);
  const slopeNorm = slope / (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)));
  const valleyPos = 0.3 + seed("valley") * 0.4;
  const dist = (u - v) - (valleyPos - 0.5);
  const valley = Math.exp(-(dist * dist) / 0.03);
  const noise = sampleGrid(fineGrid, u, v);
  return Math.max(0, Math.min(1, slopeNorm * 0.65 + noise * 0.25 - valley * 0.4));
}

function RampPreview({ stops, seedId, size = 96 }) {
  const canvasRef = useRef(null);
  const seed = useMemo(() => (k) => hashStr(`${seedId}-terrain-${k}`), [seedId]);
  const fineGrid = useMemo(() => makeNoiseGrid(seedId, "fine", 6), [seedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const res = 48; // internal resolution — canvas smoothing blurs it up to `size`
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(res, res);
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const h = terrainHeight(x / (res - 1), y / (res - 1), seed, fineGrid);
        const [r, g, b] = hexToRgb(sampleRamp(stops, h));
        const i = (y * res + x) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [stops, seed, fineGrid]);

  return (
    <div style={{
      width: size, height: size, borderRadius: 4, overflow: "hidden",
      border: "1px solid var(--border-primary)", background: "var(--surface-2)", flexShrink: 0,
    }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", imageRendering: "auto" }} />
    </div>
  );
}

const TABS = [
  { id: "general", label: "General" },
  { id: "symbology", label: "Symbology" },
  { id: "labels", label: "Labels" },
  { id: "metadata", label: "Metadata" },
];

// Matches the General tab's Projection (CRS) options — so a CRS picked
// there shows up as its EPSG code here too.
const EPSG_BY_PROJECTION = {
  "OSGB36 British National Grid": "EPSG:27700",
  "WGS 84": "EPSG:4326",
  "ETRS89 / UTM zone 30N": "EPSG:25830",
};

// Metadata section divider (Figma "Boundary ————") — a label with a rule
// filling the rest of the row.
function MetaSectionHeader({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "var(--fs-s)", fontWeight: 500, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: "1 0 0", height: 1, background: "var(--border-primary)" }} />
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 100, flexShrink: 0, fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>{label}</span>
      <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-s)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 32 }}>
      <span style={{ width: 100, flexShrink: 0, fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>{label}</span>
      <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// State colours shared by TextInput/SelectInput — the "Standard" column of
// the Flood Component Library's Input Field spec (node 3062:90251):
// Default → Hover (blue 1px border, text darkens) → Focus (black 2px
// border, white bg) → Disabled (surface-4/border-secondary, text-secondary).
// Success/Error variants aren't wired since nothing in this form validates.
function fieldChrome({ disabled, focus, hover }) {
  return {
    background: disabled ? "var(--surface-4)" : focus ? "var(--surface-1)" : "var(--surface-2)",
    border: disabled
      ? "1px solid var(--border-secondary)"
      : focus ? "2px solid var(--text-primary-selected)"
        : hover ? "1px solid var(--surface-brand)" : "1px solid var(--border-primary)",
    color: disabled
      ? "var(--text-secondary)"
      : focus ? "var(--text-primary-selected)"
        : hover ? "var(--text-primary)" : "var(--text-secondary)",
  };
}

function TextInput({ value, onChange, width, align, readOnly }) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const chrome = fieldChrome({ disabled: readOnly, focus, hover });
  return (
    <input
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: width ?? "100%", height: 32, boxSizing: "border-box", padding: "6px 8px",
        borderRadius: 2, fontSize: "var(--fs-s)", textAlign: align, outline: "none",
        cursor: readOnly ? "default" : "text", ...chrome,
      }}
    />
  );
}

// Dropdown look matching the design's field chrome (native <select>, just
// stripped of its OS chrome and given the same border/radius as the other
// inputs, with our own chevron drawn on top).
function SelectInput({ value, onChange, options, flex, disabled }) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const chrome = fieldChrome({ disabled, focus, hover });
  return (
    <div style={{ position: "relative", flex: flex ?? "1 0 0", minWidth: 0 }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <select
        value={value} onChange={onChange} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: "100%", height: 32, boxSizing: "border-box", appearance: "none", WebkitAppearance: "none",
          borderRadius: 2, fontSize: "var(--fs-s)", padding: "0 28px 0 8px", outline: "none",
          cursor: disabled ? "default" : "pointer", ...chrome,
        }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <Icon src={A.keyDown} size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// Legend-style fieldset — a bordered box with its label as a chip
// overlapping the top border (Figma "Rendering"/"Colour ramp" boxes).
function Fieldset({ label, children }) {
  return (
    <div style={{ position: "relative", marginTop: 10, border: "1px solid var(--border-primary)", borderRadius: 4, padding: 16 }}>
      <span style={{
        position: "absolute", top: -9, left: 10, background: "var(--surface-1)", padding: "0 4px",
        fontSize: "var(--fs-s)", fontWeight: 500, color: "var(--text-primary-selected)",
      }}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

// Sliding pill toggle (Figma "FloodInlineToggle") — knob carries a check/x
// glyph rather than being blank, matching the design's toggle rows (Custom,
// Clip out of range, Display NoData values, Apply hillshading).
// FloodInlineToggle (Flood Component Library, node 4418:120356) — the 24px
// track size; FlowLinesPanel.jsx's `Toggle` is the same component's 16px
// sibling (node 4418:120373). Off is a bordered white knob + black X, both
// left-aligned; On swaps to Figma's blue/blue-800 (#3b6de6 — not one of our
// own tokens) with a plain white knob + white check, right-aligned — the
// knob and icon trade places rather than a knob sliding over a fixed icon.
function BigToggle({ on, onChange, label, disabled }) {
  const knob = (
    <span style={{
      width: 16, height: 16, borderRadius: "50%", flexShrink: 0, background: "#fff",
      border: on ? "none" : "1px solid var(--border-secondary)",
    }} />
  );
  const icon = (
    <span style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon src={on ? A.toggleOnCheck : A.toggleOffX} size={16} />
    </span>
  );
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: disabled ? "default" : "pointer", width: "fit-content", opacity: disabled ? 0.5 : 1 }}>
      <span
        onClick={() => !disabled && onChange(!on)}
        style={{
          width: 44, height: 24, borderRadius: 16, padding: 4, boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start",
          background: on ? "#3b6de6" : "var(--neutral-600)",
          border: on ? "none" : "1px solid var(--border-secondary)",
        }}
      >
        {on ? <>{icon}{knob}</> : <>{knob}{icon}</>}
      </span>
      {label && <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}

// Text button (Figma "fm-v8.0-primary-button"/"fm-v8.0-secondary-button",
// 32px size — Flood Component Library node 501:80768). Ghost/Danger/Utility
// variants exist in the library too, but nothing in this modal needs them.
function Button({ variant = "secondary", onClick, children, title }) {
  const [hover, setHover] = useState(false);
  const primary = variant === "primary";
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        height: 32, padding: "8px 16px", borderRadius: 2, whiteSpace: "nowrap",
        fontSize: "var(--fs-s)", fontWeight: 500, cursor: "pointer",
        background: primary ? (hover ? "var(--blue-700)" : "var(--surface-brand)") : (hover ? "var(--surface-3)" : "var(--surface-1)"),
        border: primary ? "none" : "1px solid var(--border-primary)",
        color: primary ? "var(--text-invert)" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({ icon, onClick, title, disabled }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2,
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, padding: 0,
    }}>
      <Icon src={icon} size={16} />
    </button>
  );
}

// Colour swatch + hex label (Figma "Colour range" endpoints) — clicking the
// swatch opens the native colour picker; the hex text just mirrors it.
function ColourSwatch({ hex, onChange, width = 48 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 0 0", minWidth: 0, background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2, height: 32, padding: "0 8px", boxSizing: "border-box" }}>
      <label style={{ position: "relative", display: "block", width, height: 16, borderRadius: 2, background: hex, border: "1px solid var(--border-primary)", cursor: "pointer", flexShrink: 0 }}>
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", padding: 0, border: "none" }} />
      </label>
      <span style={{ fontSize: "var(--fs-s)", color: "var(--text-secondary)" }}>{hex}</span>
    </div>
  );
}

// Two-handle zoom-level slider (Figma "Layer visibility ▸ Zoom range") —
// same drag-a-handle-along-a-track mechanics as GlobalAnimatorFooter's trim
// handles, just min/max instead of start/end.
function ZoomRangeSlider({ min, max, bounds = [1, 20], onChange, disabled }) {
  const trackRef = useRef(null);
  const pct = (v) => `${((v - bounds[0]) / (bounds[1] - bounds[0])) * 100}%`;

  const onHandleDown = (which) => (e) => {
    if (disabled) return;
    e.stopPropagation();
    const onMove = (ev) => {
      const r = trackRef.current.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      const v = Math.round(bounds[0] + frac * (bounds[1] - bounds[0]));
      if (which === "min") onChange(Math.min(v, max), max);
      else onChange(min, Math.max(v, min));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const fillColor = disabled ? "var(--text-secondary)" : "var(--surface-brand)";
  const dotColor = disabled ? "var(--text-secondary)" : "var(--surface-brand)";
  return (
    <div ref={trackRef} style={{ position: "relative", flex: "1 0 0", height: 24, display: "flex", alignItems: "center" }}>
      {/* Static centre reference tick (Figma "Vector 10") — a fixed decoration, not tied to either handle. */}
      <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, background: "var(--border-secondary)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, height: 2, borderRadius: 8, background: "var(--surface-4)" }} />
      <div style={{ position: "absolute", left: pct(min), right: `${100 - parseFloat(pct(max))}%`, height: 2, borderRadius: 8, background: fillColor }} />
      {["min", "max"].map((which) => (
        <div key={which} onMouseDown={onHandleDown(which)} title={`Drag to set ${which} zoom`} data-name="fm-v8-slider-point" style={{
          position: "absolute", left: pct(which === "min" ? min : max), top: "50%", transform: "translate(-50%, -50%)",
          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: disabled ? "default" : "ew-resize",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
        </div>
      ))}
    </div>
  );
}

// Single-handle slider (Figma "fm-v8-slider-point") — same flat 2px track +
// 8px filled dot the zoom-range slider above uses, for a single value
// instead of a min/max pair (Opacity, Label size, Label buffer width).
function Slider({ value, min, max, onChange, disabled }) {
  const trackRef = useRef(null);
  const pct = `${((value - min) / (max - min)) * 100}%`;

  const onDown = (e) => {
    if (disabled) return;
    const move = (ev) => {
      const r = trackRef.current.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      onChange(Math.round(min + frac * (max - min)));
    };
    move(e);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const color = disabled ? "var(--text-secondary)" : "var(--surface-brand)";
  return (
    <div ref={trackRef} onMouseDown={onDown} style={{ position: "relative", flex: "1 0 0", height: 24, display: "flex", alignItems: "center", cursor: disabled ? "default" : "pointer" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: 2, borderRadius: 8, background: "var(--surface-4)" }} />
      <div style={{ position: "absolute", left: 0, width: pct, height: 2, borderRadius: 8, background: color }} />
      <div style={{ position: "absolute", left: pct, top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      </div>
    </div>
  );
}

// "What this label looks like" preview (Figma's dashed-border "abcABC123"
// swatch) — same live-preview role RampPreview plays for Symbology.
function LabelPreview({ font, bold, italic, color, size, disabled, sample = "abcABC123" }) {
  return (
    <div style={{
      width: 96, height: 96, borderRadius: 4, border: "1px dashed var(--border-secondary)",
      background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden", opacity: disabled ? 0.4 : 1,
    }}>
      <span style={{
        fontFamily: font, fontWeight: bold ? 700 : 400, fontStyle: italic ? "italic" : "normal",
        color, fontSize: Math.max(10, Math.min(20, size / 1.4)), padding: "0 4px", textAlign: "center",
      }}>{sample}</span>
    </div>
  );
}

// Three-way anchor picker (Figma "Label style ▸ Position") — each segment is
// a mini bar standing in for "label sits before/on/after the line", the
// selected one darker with a centre dot.
function PositionPicker({ value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", flex: "1 0 0", height: 32, border: "1px solid var(--border-primary)", borderRadius: 2, overflow: "hidden", opacity: disabled ? 0.4 : 1 }}>
      {[0, 1, 2].map((i) => (
        <button key={i} onClick={() => !disabled && onChange(i)} disabled={disabled} style={{
          position: "relative", flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          background: i === value ? "var(--surface-4)" : "var(--surface-2)",
          border: "none", borderRight: i < 2 ? "1px solid var(--border-primary)" : "none",
          cursor: disabled ? "default" : "pointer",
        }}>
          <span style={{ width: 20, height: 2, borderRadius: 1, background: "var(--border-secondary)" }} />
          {i === value && <span style={{ position: "absolute", width: 6, height: 6, borderRadius: "50%", background: "var(--surface-1)", border: "1px solid var(--text-secondary)" }} />}
        </button>
      ))}
    </div>
  );
}

export default function LayerPropertiesModal({ target, onApply, onClose }) {
  const [tab, setTab] = useState("general");
  const [rampId, setRampId] = useState(target.ramp?.id || "turbo");
  const [stops, setStops] = useState(target.ramp?.stops || PRESET_RAMPS[0].stops);
  const [rampInterval, setRampInterval] = useState("Equidistant");
  const [stepCount, setStepCount] = useState(6);
  const [customRange, setCustomRange] = useState(false);
  const [min, setMin] = useState(target.min ?? 0);
  const [max, setMax] = useState(target.max ?? 1);
  const [steps, setSteps] = useState(() => buildSteps(stops, stepCount, min, max));
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [renderType, setRenderType] = useState("Graduated");
  const [field, setField] = useState(target.field || "Example_Value");
  const [clipOutOfRange, setClipOutOfRange] = useState(false);
  const [displayNoData, setDisplayNoData] = useState(false);
  const [hillshading, setHillshading] = useState(true);

  // General tab
  const [displayName, setDisplayName] = useState(target.title);
  const [description, setDescription] = useState(target.description || "");
  const [projection, setProjection] = useState("OSGB36 British National Grid");
  const [opacity, setOpacity] = useState(100);
  const [zoomRangeOn, setZoomRangeOn] = useState(false);
  const [zoomMin, setZoomMin] = useState(3);
  const [zoomMax, setZoomMax] = useState(18);

  // Labels tab
  const [attributeType, setAttributeType] = useState("Single symbol");
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [font, setFont] = useState("Arial");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(true);
  const [labelColor, setLabelColor] = useState("#123FED");
  const [labelSize, setLabelSize] = useState(24);
  const [labelPosition, setLabelPosition] = useState(1);
  const [orientation, setOrientation] = useState("Follow path");
  const [avoidDuplicates, setAvoidDuplicates] = useState(false);
  const [avoidOverlaps, setAvoidOverlaps] = useState(false);
  const [bufferColor, setBufferColor] = useState("#000000");
  const [bufferStyle, setBufferStyle] = useState("Outline");
  const [bufferWidth, setBufferWidth] = useState(4);

  const regenerate = (nextStops, nextCount, nextMin, nextMax) =>
    setSteps(buildSteps(nextStops, nextCount, nextMin, nextMax));

  const pickRamp = (r) => {
    setRampId(r.id);
    setStops(r.stops);
    regenerate(r.stops, stepCount, min, max);
  };
  const toggleReverse = () => {
    const ns = reverseColors(stops);
    setStops(ns);
    setRampId("custom");
    regenerate(ns, stepCount, min, max);
  };
  const setEndpointColor = (which, hex) => {
    const ns = stops.map(([p, c], i, arr) => ((which === "start" && i === 0) || (which === "end" && i === arr.length - 1)) ? [p, hex] : [p, c]);
    setStops(ns);
    setRampId("custom");
    regenerate(ns, stepCount, min, max);
  };
  const changeCount = (n) => {
    const c = Math.max(2, Math.min(20, n || 2));
    setStepCount(c);
    regenerate(stops, c, min, max);
  };
  const changeRange = (nMin, nMax) => {
    setMin(nMin); setMax(nMax);
    regenerate(stops, stepCount, nMin, nMax);
  };

  const updateStep = (id, patch) => setSteps((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStep = (id) => setSteps((ss) => (ss.length > 2 ? ss.filter((s) => s.id !== id) : ss));
  const addStep = (dir) => setSteps((ss) => {
    const idx = ss.findIndex((s) => s.id === selectedStepId);
    const anchor = idx >= 0 ? idx : ss.length - 1;
    const at = dir === "above" ? anchor : anchor + 1;
    const neighbor = ss[anchor] || ss[ss.length - 1];
    const copy = { ...neighbor, id: `s-${ss.length}-${Math.round(Math.random() * 1e6)}` };
    const next = [...ss];
    next.splice(at, 0, copy);
    return next;
  });

  // Metadata tab — deterministic fake extent/file stats seeded off the
  // target's id, same "no real data behind this, stable per item" spirit as
  // GlobalAnimatorFooter's waveform and LongSectionModal's station stats.
  const meta = useMemo(() => {
    const seed = (k) => hashStr(`${target.id}-meta-${k}`);
    const xMin = 380000 + seed("x0") * 20000;
    const xMax = xMin + 400 + seed("x1") * 600;
    const yMin = 230000 + seed("y0") * 20000;
    const yMax = yMin + 300 + seed("y1") * 500;
    return {
      xMin: xMin.toFixed(3), xMax: xMax.toFixed(3), yMin: yMin.toFixed(3), yMax: yMax.toFixed(3),
      featureCount: Math.round(4 + seed("fc") * 400),
      fileSize: (0.4 + seed("sz") * 12).toFixed(1),
    };
  }, [target.id]);

  const handleApply = () => {
    onApply({
      name: displayName,
      description,
      opacity,
      color: steps[0]?.color || target.color || "#2f6fed",
      ramp: { id: rampId, stops, steps, min, max },
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", zIndex: 300 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 608, height: 688, display: "flex", flexDirection: "column",
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
          boxShadow: "0 2px 10px 2px rgba(0,0,0,0.25)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <Icon src={A.settingsOutline} size={16} />
          <span style={{ flex: "1 0 0", fontSize: "var(--fs-s)", fontWeight: 500, color: "var(--text-primary-selected)" }}>
            Layer Properties ({target.title})
          </span>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", borderRadius: 2 }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
            <Icon src={A.cancel} size={12} />
          </button>
        </div>

        {/* Body: tab rail + content */}
        <div style={{ flex: "1 0 0", minHeight: 0, display: "flex" }}>
          <div style={{ width: 120, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border-primary)", padding: "8px 8px" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                textAlign: "left", padding: "8px 4px", border: "none", background: "transparent", cursor: "pointer",
                borderBottom: t.id === tab ? "2px solid var(--surface-brand)" : "1px solid var(--surface-3)",
                fontSize: "var(--fs-s)", fontWeight: t.id === tab ? 500 : 400,
                color: t.id === tab ? "var(--text-primary-selected)" : "var(--text-secondary)",
              }}>{t.label}</button>
            ))}
            <div style={{ flex: "1 0 0" }} />
            {tab === "symbology" && <RampPreview stops={stops} seedId={target.id} />}
            {tab === "labels" && <LabelPreview font={font} bold={bold} italic={italic} color={labelColor} size={labelSize} disabled={!labelsVisible} />}
          </div>

          <div style={{ flex: "1 0 0", minWidth: 0, overflowY: "auto", padding: 16 }}>
            {tab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Fieldset label="Layer information">
                  <FieldRow label="File name">
                    <TextInput value={target.title} readOnly />
                    <Button title="Not wired up in this demo">File location</Button>
                  </FieldRow>
                  <FieldRow label="Display name">
                    <TextInput value={displayName} onChange={setDisplayName} />
                  </FieldRow>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ width: 100, flexShrink: 0, fontSize: "var(--fs-s)", color: "var(--text-primary)", paddingTop: 6 }}>Description</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      style={{
                        flex: "1 0 0", minWidth: 0, padding: "6px 8px", resize: "none",
                        background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2,
                        fontSize: "var(--fs-s)", color: "var(--text-secondary)", font: "inherit",
                      }}
                    />
                  </div>
                  <FieldRow label="Projection (CRS)">
                    <SelectInput value={projection} onChange={(e) => setProjection(e.target.value)} options={["OSGB36 British National Grid", "WGS 84", "ETRS89 / UTM zone 30N"]} />
                    <button title="Not wired up in this demo" style={{
                      width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: "50%", cursor: "pointer",
                    }}>
                      <Icon src={A.worldMapView2} size={16} />
                    </button>
                  </FieldRow>
                </Fieldset>

                <Fieldset label="Layer visibility">
                  <FieldRow label="Opacity">
                    <Slider value={opacity} min={0} max={100} onChange={setOpacity} />
                    <TextInput value={`${opacity}%`} onChange={(v) => setOpacity(Math.max(0, Math.min(100, parseInt(v) || 0)))} width={70} align="right" />
                  </FieldRow>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <BigToggle on={zoomRangeOn} onChange={setZoomRangeOn} label="Zoom range" />
                    <TextInput value={zoomMin} onChange={(v) => setZoomMin(Number(v) || 0)} width={48} align="right" readOnly={!zoomRangeOn} />
                    <ZoomRangeSlider min={zoomMin} max={zoomMax} onChange={(nMin, nMax) => { setZoomMin(nMin); setZoomMax(nMax); }} disabled={!zoomRangeOn} />
                    <TextInput value={zoomMax} onChange={(v) => setZoomMax(Number(v) || 0)} width={48} align="right" readOnly={!zoomRangeOn} />
                  </div>
                </Fieldset>
              </div>
            )}

            {tab === "symbology" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Fieldset label="Rendering">
                  <FieldRow label="Render type">
                    <SelectInput value={renderType} onChange={(e) => setRenderType(e.target.value)} options={["Graduated", "Single symbol", "Categorised"]} />
                  </FieldRow>
                  <FieldRow label="Field">
                    <SelectInput value={field} onChange={(e) => setField(e.target.value)} options={["Example_Value", "Depth (m)", "Velocity (m/s)", "Water level (mAOD)"]} />
                  </FieldRow>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <BigToggle on={customRange} onChange={setCustomRange} label="Custom" />
                    <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>Min</span>
                    <TextInput value={min} onChange={(v) => changeRange(Number(v) || 0, max)} width={90} align="right" readOnly={!customRange} />
                    <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>Max</span>
                    <TextInput value={max} onChange={(v) => changeRange(min, Number(v) || 0)} width={90} align="right" readOnly={!customRange} />
                  </div>
                </Fieldset>

                {renderType === "Graduated" && (
                  <Fieldset label="Colour ramp">
                    <FieldRow label="Colour range">
                      <ColourSwatch hex={stops[0][1]} onChange={(hex) => setEndpointColor("start", hex)} />
                      <ColourSwatch hex={stops[stops.length - 1][1]} onChange={(hex) => setEndpointColor("end", hex)} />
                    </FieldRow>

                    {/* Predefined ramp picker — click a swatch to load the whole ramp */}
                    <FieldRow label="Presets">
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {PRESET_RAMPS.map((r) => (
                          <button key={r.id} onClick={() => pickRamp(r)} title={r.name} style={{
                            width: 56, height: 20, borderRadius: 2, cursor: "pointer",
                            border: r.id === rampId ? "2px solid var(--surface-brand)" : "1px solid var(--border-primary)",
                            background: rampCss(r.stops), padding: 0,
                          }} />
                        ))}
                      </div>
                    </FieldRow>

                    <FieldRow label="Ramp intervals">
                      <SelectInput value={rampInterval} onChange={(e) => setRampInterval(e.target.value)} options={["Equidistant", "Quantile", "Manual"]} flex="0 0 160px" />
                      <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>x</span>
                      <TextInput value={stepCount} onChange={(v) => changeCount(Number(v))} width={70} align="right" />
                    </FieldRow>

                    {/* Continuous gradient preview */}
                    <div style={{ height: 24, borderRadius: 2, border: "1px solid var(--border-primary)", background: rampCss(stops) }} />

                    {/* Steps table */}
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <IconBtn icon={A.layersAddAbove} onClick={() => addStep("above")} title="Add step above selection" />
                      <IconBtn icon={A.layersAddBelow} onClick={() => addStep("below")} title="Add step below selection" />
                      <IconBtn icon={A.reversePath} onClick={toggleReverse} title="Reverse ramp direction" />
                      <IconBtn icon={A.rampRemove} onClick={() => selectedStepId && removeStep(selectedStepId)} disabled={!selectedStepId} title="Remove selected step" />
                    </div>
                    <div style={{ border: "1px solid var(--border-secondary)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ display: "flex", background: "var(--surface-2)", borderBottom: "1px solid var(--border-secondary)", fontSize: "var(--fs-xxs)", fontWeight: 500, color: "var(--text-primary)" }}>
                        <div style={{ width: 32, flexShrink: 0, padding: "4px 8px" }} />
                        <div style={{ width: 96, flexShrink: 0, padding: "4px 8px" }}>Colour</div>
                        <div style={{ flex: "1 0 0", padding: "4px 8px" }}>NameCategory</div>
                        <div style={{ flex: "1 0 0", padding: "4px 8px" }}>Label</div>
                      </div>
                      <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {steps.map((s, i) => (
                          <div key={s.id} onClick={() => setSelectedStepId(s.id)} style={{
                            display: "flex", alignItems: "center", borderBottom: "1px solid var(--border-primary)",
                            background: s.id === selectedStepId ? "var(--surface-3)" : i % 2 ? "var(--surface-2)" : "var(--surface-1)", cursor: "pointer",
                          }}>
                            <div style={{ width: 32, flexShrink: 0, padding: "4px 8px", display: "flex", justifyContent: "center" }}>
                              <input type="checkbox" checked={s.on} onChange={(e) => { e.stopPropagation(); updateStep(s.id, { on: e.target.checked }); }} onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div style={{ width: 96, flexShrink: 0, padding: "4px 8px", display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                              <label style={{ position: "relative", display: "block", width: 16, height: 16, borderRadius: 2, background: s.color, border: "1px solid var(--border-primary)", cursor: "pointer", flexShrink: 0 }}>
                                <input type="color" value={s.color} onChange={(e) => updateStep(s.id, { color: e.target.value })} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", padding: 0, border: "none" }} />
                              </label>
                              <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.color}</span>
                            </div>
                            <div style={{ flex: "1 0 0", padding: "4px 8px", fontSize: "var(--fs-xxs)", color: "var(--text-primary)" }}>{s.value}</div>
                            <div style={{ flex: "1 0 0", padding: "4px 8px" }} onClick={(e) => e.stopPropagation()}>
                              <input value={s.label} onChange={(e) => updateStep(s.id, { label: e.target.value })} style={{ width: "100%", border: "none", background: "transparent", fontSize: "var(--fs-xxs)", color: "var(--text-primary)" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <BigToggle on={clipOutOfRange} onChange={setClipOutOfRange} label="Clip out of range" />
                    <BigToggle on={displayNoData} onChange={setDisplayNoData} label="Display NoData values" />
                    <BigToggle on={hillshading} onChange={setHillshading} label="Apply hillshading" />
                  </Fieldset>
                )}
              </div>
            )}

            {tab === "labels" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <Fieldset label="Label attribute">
                  <FieldRow label="Attribute type">
                    <SelectInput value={attributeType} onChange={(e) => setAttributeType(e.target.value)} options={["Single symbol", "Field value", "Expression"]} />
                  </FieldRow>
                </Fieldset>

                <Fieldset label="Label style">
                  <BigToggle on={labelsVisible} onChange={setLabelsVisible} label="Labels visible" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: labelsVisible ? 1 : 0.4, pointerEvents: labelsVisible ? "auto" : "none" }}>
                    <FieldRow label="Font">
                      <SelectInput value={font} onChange={(e) => setFont(e.target.value)} options={["Arial", "IBM Plex Sans", "Roboto", "Times New Roman"]} />
                      <div style={{ display: "flex", height: 32, flexShrink: 0, border: "1px solid var(--border-primary)", borderRadius: 2, overflow: "hidden" }}>
                        <button onClick={() => setBold((b) => !b)} title="Bold" style={{ width: 32, fontWeight: 700, background: bold ? "var(--surface-4)" : "var(--surface-1)", border: "none", borderRight: "1px solid var(--border-primary)", cursor: "pointer", color: "var(--text-primary)" }}>B</button>
                        <button onClick={() => setItalic((i) => !i)} title="Italic" style={{ width: 32, fontStyle: "italic", background: italic ? "var(--surface-4)" : "var(--surface-1)", border: "none", borderRight: "1px solid var(--border-primary)", cursor: "pointer", color: "var(--text-primary)" }}>I</button>
                        <button title="More text settings (not wired up in this demo)" style={{ width: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-1)", border: "none", cursor: "pointer" }}>
                          <Icon src={A.settingsOutline} size={14} />
                        </button>
                      </div>
                    </FieldRow>
                    <FieldRow label="Colour">
                      <ColourSwatch hex={labelColor} onChange={setLabelColor} />
                    </FieldRow>
                    <FieldRow label="Size">
                      <Slider value={labelSize} min={8} max={48} onChange={setLabelSize} disabled={!labelsVisible} />
                      <TextInput value={`${labelSize}px`} onChange={(v) => setLabelSize(Math.max(8, Math.min(48, parseInt(v) || 8)))} width={70} align="right" />
                    </FieldRow>
                    <FieldRow label="Position">
                      <PositionPicker value={labelPosition} onChange={setLabelPosition} />
                    </FieldRow>
                    <FieldRow label="Orientation">
                      <SelectInput value={orientation} onChange={(e) => setOrientation(e.target.value)} options={["Follow path", "Horizontal", "Perpendicular"]} />
                    </FieldRow>
                    <BigToggle on={avoidDuplicates} onChange={setAvoidDuplicates} label="Avoid duplicates" />
                    <BigToggle on={avoidOverlaps} onChange={setAvoidOverlaps} label="Avoid overlaps" />
                  </div>
                </Fieldset>

                <div style={{ opacity: labelsVisible ? 1 : 0.4, pointerEvents: labelsVisible ? "auto" : "none" }}>
                  <Fieldset label="Label buffer">
                    <FieldRow label="Colour">
                      <ColourSwatch hex={bufferColor} onChange={setBufferColor} />
                    </FieldRow>
                    <FieldRow label="Style">
                      <SelectInput value={bufferStyle} onChange={(e) => setBufferStyle(e.target.value)} options={["Outline", "Halo", "None"]} />
                    </FieldRow>
                    <FieldRow label="Width">
                      <Slider value={bufferWidth} min={0} max={12} onChange={setBufferWidth} disabled={!labelsVisible} />
                      <TextInput value={`${bufferWidth}px`} onChange={(v) => setBufferWidth(Math.max(0, Math.min(12, parseInt(v) || 0)))} width={70} align="right" />
                    </FieldRow>
                  </Fieldset>
                </div>
              </div>
            )}
            {tab === "metadata" && (
              <Fieldset label="Metadata information">
                <MetaSectionHeader label="File" />
                <FieldRow label="Path">
                  <TextInput value={`C:\\Users\\NameExample\\Downloads\\${target.title}`} readOnly />
                  <button title="Not wired up in this demo" style={{
                    width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2, cursor: "pointer",
                  }}>
                    <Icon src={A.filesFolder} size={16} />
                  </button>
                </FieldRow>

                <MetaSectionHeader label="Data type" />
                <span style={{ fontSize: "var(--fs-s)", color: "var(--text-secondary)" }}>
                  {target.kind === "result" ? `TUFLOW ISIS 2D — ${target.title}` : "Vector polygon layer"}
                </span>

                <MetaSectionHeader label="Boundary" />
                <MetaRow label="X Minimum:" value={meta.xMin} />
                <MetaRow label="X Maximum:" value={meta.xMax} />
                <MetaRow label="Y Minimum:" value={meta.yMin} />
                <MetaRow label="Y Maximum:" value={meta.yMax} />

                <MetaSectionHeader label="Projection" />
                <MetaRow label="EPSG code:" value={EPSG_BY_PROJECTION[projection] || "—"} />

                <MetaSectionHeader label="Properties" />
                <MetaRow label="Geometry:" value={target.kind === "result" ? "Raster" : "Polygon"} />
                <MetaRow label="Features:" value={meta.featureCount} />
                <MetaRow label="File size:" value={`${meta.fileSize} MB`} />
              </Fieldset>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <span style={{
            width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--text-tertiary)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--text-tertiary)",
          }}>?</span>
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>Help</span>
          <div style={{ flex: "1 0 0" }} />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleApply}>Apply changes</Button>
        </div>
      </div>
    </div>
  );
}
