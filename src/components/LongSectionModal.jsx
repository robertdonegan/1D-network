import { useState, useRef, useMemo, useLayoutEffect, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { METERS_PER_WORLD_UNIT } from "./OsmBasemap.jsx";

// "Long Section" plot (Figma fm-v8.0-modal-frame + fm-v8.0-long-section):
// a staged long-section visualisation down a selection of 1D units — bed,
// stage and left/right bank profiles, per-station cross-section gridlines,
// a hover tooltip and a live timestep pill. Elevation data is simulated
// deterministically from each unit's id (no real model behind the fork), the
// same "demo data, stable per node" spirit as the rest of the prototype.
// Stations are ordered spatially (projected onto the reach's principal axis)
// and spaced by real on-map metres so the x axis reads as a true chainage.

const Y_MIN = 5.0, Y_MAX = 13.5; // Elevation (m AD) axis
const PLOT_H = 300;              // series area height
const PAD_T = 12, PAD_B = 6;     // vertical padding inside the series area
const ML = 14, MR = 12;          // horizontal margins inside the series area
const LINE_WIDTHS = [0.5, 1, 1.5, 2, 3];
const Y_TICKS = [];
for (let v = Y_MAX; v >= Y_MIN - 1e-9; v -= 0.5) Y_TICKS.push(v);

// Series colours — match the Figma long-section style.
const COL = {
  stage: "#468af3",
  bed: "#333",
  left: "#ef9625",
  right: "#a440a8",
  grid: "#e6e6e6",
};

function hashStr(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return (x >>> 0) / 4294967295;
}

// Deterministic bed/stage/left/right bank levels for one station (all within
// the 5.0–13.5 m AD axis).
function stationStats(n, i) {
  const v1 = hashStr(n.id), v2 = hashStr(n.id + "R"),
    v3 = hashStr(n.id + "L"), v4 = hashStr(n.id + "S");
  const bed = 6.6 - 0.045 * i + v1 * 1.5;
  const stage = bed + 1.5 + v4 * 1.05;
  const left = bed + 3.2 + v3 * 1.05;
  const right = bed + 3.0 + v2 * 1.0;
  return { bed, stage, left, right };
}

function Swatch({ dashed, color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
      <line x1="1" y1="6" x2="11" y2="6" stroke={color} strokeWidth="2"
        strokeDasharray={dashed ? "3 2" : undefined} strokeLinecap="round" />
    </svg>
  );
}

function ToolbarBtn({ icon, label, iconRhs, onClick, title, active }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: "flex", alignItems: "center", gap: 2, height: 24, padding: "4px 8px",
        background: active ? "var(--surface-brand)" : "var(--surface-1)",
        border: "1px solid var(--border-primary)", borderRadius: 2,
        cursor: onClick ? "pointer" : "default", flexShrink: 0,
      }}>
      {icon && <Icon src={icon} size={16} style={active ? { filter: "brightness(0) invert(1)" } : undefined} />}
      {label && <span style={{ fontSize: 12, fontWeight: 500, color: active ? "#fff" : "var(--text-secondary)", whiteSpace: "nowrap" }}>{label}</span>}
      {iconRhs && <Icon src={iconRhs} size={16} />}
    </button>
  );
}

// Order the chosen units into a sensible down-network long section: project
// each node onto the selection's principal axis (the river direction), sort
// by that projection, then chainage = cumulative real on-map metres between
// consecutive stations.
function buildStations(nodeIds, nodes) {
  const ns = nodeIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean);
  if (ns.length < 2) return [];
  const cx = ns.reduce((s, n) => s + n.x, 0) / ns.length;
  const cy = ns.reduce((s, n) => s + n.y, 0) / ns.length;
  let sxx = 0, syy = 0, sxy = 0;
  ns.forEach((n) => {
    const dx = n.x - cx, dy = n.y - cy;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  });
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const dir = { x: Math.cos(theta), y: Math.sin(theta) };
  const t = (n) => (n.x - cx) * dir.x + (n.y - cy) * dir.y;
  const sorted = [...ns].sort((a, b) => t(a) - t(b));
  const stations = [];
  let chain = 0;
  sorted.forEach((n, i) => {
    if (i > 0) {
      const p = sorted[i - 1];
      chain += Math.hypot(n.x - p.x, n.y - p.y) * METERS_PER_WORLD_UNIT;
    }
    stations.push({ n, chain, ...stationStats(n, i) });
  });
  return stations;
}

export default function LongSectionModal({ nodeIds = [], nodes = [], onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [lineWidth, setLineWidth] = useState(1.5);
  const [selIdx, setSelIdx] = useState(-1);
  const [hover, setHover] = useState(null); // { x, idx }
  const svgRef = useRef(null);
  const [chartW, setChartW] = useState(800);

  const stations = useMemo(() => buildStations(nodeIds, nodes), [nodeIds, nodes]);
  const count = stations.length;
  const total = Math.max(stations[count - 1]?.chain || 0, 1);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const set = () => setChartW(el.clientWidth);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);

  useEffect(() => { if (selIdx < 0 && count) setSelIdx(Math.floor(count / 2)); }, [count, selIdx]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const geom = useMemo(() => {
    const inner = PLOT_H - PAD_T - PAD_B;
    const sy = (v) => PAD_T + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * inner;
    const xPos = stations.map((s, i) => ML + (s.chain / total) * (chartW - ML - MR));
    return { sy, xPos };
  }, [stations, total, chartW]);
  const { sy, xPos } = geom;

  const displayIdx = hover ? hover.idx : selIdx;
  const act = displayIdx >= 0 && displayIdx < count ? stations[displayIdx] : null;
  const actX = act ? xPos[displayIdx] : 0;

  const profile = (key, dash) => {
    const stroke = COL[key];
    return (
      <path
        d={stations.map((s, i) => `${i ? "L" : "M"} ${xPos[i]} ${sy(s[key])}`).join(" ")}
        fill="none" stroke={stroke} strokeWidth={lineWidth}
        strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  };
  const bedFill = stations.length
    ? `${stations.map((s, i) => `${i ? "L" : "M"} ${xPos[i]} ${sy(s.bed)}`).join(" ")} L ${xPos[count - 1]} ${PLOT_H} L ${xPos[0]} ${PLOT_H} Z`
    : "";

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0, bestD = Infinity;
    xPos.forEach((p, i) => { const d = Math.abs(p - x); if (d < bestD) { bestD = d; best = i; } });
    setHover({ x, idx: best });
  };

  const tooltipLeft = Math.min(Math.max((hover ? hover.x : actX) + 12, 8), Math.max(chartW - 168, 8));
  const tooltipTop = act ? Math.min(Math.max(sy(act.stage) - 12, 8), PLOT_H - 100) : 8;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", zIndex: 300 }}
      onClick={onClose}>
      <div style={{
        background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
        boxShadow: "0 2px 10px 2px rgba(0,0,0,0.25)", padding: 8, width: expanded ? 1500 : 940,
        maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 48px)",
        display: "flex", flexDirection: "column",
      }} onClick={(e) => e.stopPropagation()}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 28, flexShrink: 0 }}>
          <Icon src={A.results1dLongSection} size={16} />
          <span style={{ flex: "1 0 0", fontSize: 14, fontWeight: 500, color: "var(--text-primary-selected)" }}>
            Long Section{count ? ` — ${count} units` : ""}
          </span>
          {[A.dockWindow, A.minimise, A.dock, A.cancel].map((ic, i) => (
            <button key={i} onClick={i === 3 ? onClose : undefined}
              title={["Maximise", "Minimise", "Restore down", "Close"][i]}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 4, border: "none", background: "transparent", cursor: "pointer" }}>
              <Icon src={ic} size={12} />
            </button>
          ))}
        </div>

        {/* Plot toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, paddingTop: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <ToolbarBtn icon={A.filter} title="Filter" />
          <ToolbarBtn label="Export" iconRhs={A.download} title="Export plot" />
          <ToolbarBtn label="Edit data" iconRhs={A.dashboard} title="Edit data" />
          <div style={{ width: 1, height: 24, background: "var(--border-primary)", margin: "0 2px" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>Line width</span>
          <button onClick={() => setLineWidth(LINE_WIDTHS[(LINE_WIDTHS.indexOf(lineWidth) + 1) % LINE_WIDTHS.length])}
            title="Cycle line width"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 24, width: 56, padding: "0 4px", background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2, cursor: "pointer", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{parseFloat(lineWidth).toFixed(1)}</span>
            <Icon src={A.colOrder} size={16} />
          </button>
          <ToolbarBtn icon={A.messageReply} onClick={count ? () => setSelIdx((v) => Math.max(0, v - 1)) : undefined} title="Previous station" />
          <ToolbarBtn icon={A.messageForward} onClick={count ? () => setSelIdx((v) => Math.min(count - 1, v + 1)) : undefined} title="Next station" />
          <ToolbarBtn icon={A.expand} onClick={() => setExpanded((v) => !v)} title={expanded ? "Restore" : "Expand"} active={expanded} />
        </div>

        {count < 2 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--text-secondary)" }}>
            Select at least two 1D units on the map or in the 1D Network table to plot a long section.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 8px 0", minHeight: 0 }}>
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
              {/* Y axis */}
              <div style={{ width: 44, flexShrink: 0, position: "relative", borderRight: "1px solid var(--border-primary)" }}>
                {Y_TICKS.map((v) => (
                  <span key={v} style={{ position: "absolute", right: 4, top: sy(v) - 7, fontSize: 10, color: "var(--text-tertiary)" }}>{v.toFixed(1)}</span>
                ))}
                <span style={{ position: "absolute", top: 80, left: -16, transform: "rotate(-90deg)", transformOrigin: "center", fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                  Elevation (m AD)
                </span>
              </div>
              {/* Series */}
              <div style={{ flex: 1, minWidth: 0, position: "relative" }} onMouseLeave={() => setHover(null)}>
                <svg ref={svgRef} width="100%" height={PLOT_H} onMouseMove={onMove} style={{ display: "block", cursor: "crosshair" }}>
                  {Y_TICKS.map((v) => (
                    <line key={v} x1={0} y1={sy(v)} x2={chartW} y2={sy(v)} stroke={COL.grid} vectorEffect="non-scaling-stroke" />
                  ))}
                  {stations.map((s, i) => (
                    <line key={s.n.id} x1={xPos[i]} y1={0} x2={xPos[i]} y2={PLOT_H}
                      stroke={i === displayIdx ? "#b0b8c4" : "#dfe3e8"}
                      strokeWidth={i === displayIdx ? 1.5 : 1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                  ))}
                  <path d={bedFill} fill="#f1f4f8" />
                  {profile("left", "5 3")}
                  {profile("right", "5 3")}
                  {profile("stage")}
                  {profile("bed")}
                  {act && (
                    <g>
                      <rect x={actX - 5} y={sy(act.left) - 5} width={10} height={10} fill="#fafafa" stroke={COL.left} strokeWidth={1.5} transform={`rotate(45 ${actX} ${sy(act.left)})`} />
                      <rect x={actX - 5} y={sy(act.right) - 5} width={10} height={10} fill="#fafafa" stroke={COL.right} strokeWidth={1.5} />
                      <circle cx={actX} cy={sy(act.stage)} r={5} fill="#fafafa" stroke={COL.stage} strokeWidth={1.5} />
                    </g>
                  )}
                </svg>
                {/* timestep pill */}
                {act && (
                  <div style={{ position: "absolute", left: actX + 8, top: sy(act.stage) - 15, background: "var(--surface-brand)", color: "#fafafa", borderRadius: 2, padding: "2px 4px", fontSize: 12, fontWeight: 500, lineHeight: "12px", textAlign: "center", minWidth: 20 }}>
                    {displayIdx + 1}
                  </div>
                )}
                {/* hover / active tooltip */}
                <div style={{ position: "absolute", left: tooltipLeft, top: tooltipTop, width: 160, zIndex: 2, background: "var(--surface-1)", borderRadius: 2, padding: 8, boxShadow: "0 2px 2px rgba(0,0,0,0.1), 0 3px 3px rgba(0,0,0,0.1)", pointerEvents: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                    {act ? act.n.label : "—"}
                  </div>
                  {[
                    ["Left bank", "left", true],
                    ["Right bank", "right", true],
                    ["Stage level", "stage", false],
                    ["Bed level", "bed", false],
                  ].map(([label, key, dashed]) => (
                    <div key={label} style={{ display: "flex", gap: 2, height: 14, alignItems: "center" }}>
                      <Swatch dashed={dashed} color={COL[key]} />
                      <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{label}</span>
                      <span style={{ flex: "1 0 0", fontSize: 12, fontWeight: 500, color: "var(--text-primary)", textAlign: "right" }}>
                        {act ? act[key].toFixed(2) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* X axis: rotated station labels */}
            <div style={{ display: "flex" }}>
              <div style={{ width: 44, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, position: "relative", height: 44 }}>
                {stations.map((s, i) => (
                  <span key={s.n.id} style={{ position: "absolute", left: xPos[i] - 4, top: 6, transform: "rotate(-90deg)", transformOrigin: "left top", fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                    {s.n.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-tertiary)", paddingLeft: 44, paddingBottom: 4 }}>
              Long-section (m) · {Math.round(total).toLocaleString()} m
            </div>
            {/* legend */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "4px 0 8px", flexWrap: "wrap" }}>
              {[
                ["Stage", "stage", false],
                ["Bed elevation", "bed", false],
                ["Left bank", "left", true],
                ["Right bank", "right", true],
              ].map(([label, key, dashed]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-primary)" }}>
                  <Swatch dashed={dashed} color={COL[key]} /> {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}