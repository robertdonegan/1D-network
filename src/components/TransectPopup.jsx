import { useMemo } from "react";

// Demo-only transect chart: ground DEM profile + water stage level along a
// drawn cross-section. Data is randomly generated each time (no real DEM/
// hydraulic model behind this prototype) — purely to demonstrate the concept.
const W = 500, H = 220, PAD_L = 40, PAD_R = 16, PAD_T = 16, PAD_B = 28;
const GROUND_COLOR = "#8a5a34";
const WATER_COLOR = "#2f7de1";

function genProfile(lengthM) {
  const n = 24;
  const points = [];
  // Gentle valley: high at both banks, low in the middle, plus noise.
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const valley = Math.pow(2 * (t - 0.5), 2) * 3.2; // 0 at middle, ~3.2 at banks
    const noise = (Math.sin(i * 1.7) + Math.sin(i * 0.6 + 1)) * 0.15 + (Math.random() - 0.5) * 0.2;
    points.push({ x: t * lengthM, ground: 12 + valley + noise });
  }
  // Water stage: roughly flat, sitting above the lowest ground point, dips to
  // follow the channel bed where the bed rises above the stage.
  const stage = Math.min(...points.map((p) => p.ground)) + 1.4 + Math.random() * 0.4;
  points.forEach((p) => { p.water = Math.min(stage, p.ground + 0.05); });
  return { points, stage };
}

export default function TransectPopup({ lengthM, onClose }) {
  const { points } = useMemo(() => genProfile(Math.max(lengthM, 1)), [lengthM]);

  const minY = Math.min(...points.map((p) => Math.min(p.ground, p.water))) - 0.3;
  const maxY = Math.max(...points.map((p) => p.ground)) + 0.3;
  const sx = (x) => PAD_L + (x / Math.max(lengthM, 1)) * (W - PAD_L - PAD_R);
  const sy = (y) => H - PAD_B - ((y - minY) / (maxY - minY)) * (H - PAD_T - PAD_B);

  const groundPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.ground)}`).join(" ");
  const groundArea = `${groundPath} L ${sx(points[points.length - 1].x)} ${H - PAD_B} L ${sx(points[0].x)} ${H - PAD_B} Z`;
  const waterPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.water)}`).join(" ");
  const waterArea = `${waterPath} L ${sx(points[points.length - 1].x)} ${H - PAD_B} L ${sx(points[0].x)} ${H - PAD_B} Z`;

  // Recessive gridlines at "nice" elevation steps.
  const step = maxY - minY > 8 ? 2 : 1;
  const gridLines = [];
  for (let v = Math.ceil(minY / step) * step; v <= maxY; v += step) gridLines.push(v);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", inset: 0, zIndex: 200, display: "flex",
        alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", padding: 16, width: W + 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: "var(--fs-s)", fontWeight: 600, color: "var(--text-primary)" }}>
            Transect — {lengthM.toFixed(1)}m
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--text-tertiary)", lineHeight: 1 }}>×</button>
        </div>

        {/* Legend — two series, so identity is never colour-alone: swatch + label, label stays neutral ink */}
        <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: GROUND_COLOR, flexShrink: 0 }} />
            <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-secondary)" }}>Ground (DEM)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: WATER_COLOR, flexShrink: 0 }} />
            <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-secondary)" }}>Water stage</span>
          </div>
        </div>

        <svg width={W} height={H} style={{ display: "block" }}>
          {gridLines.map((v) => (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={sy(v)} y2={sy(v)} stroke="var(--border-primary)" strokeWidth={1} />
              <text x={PAD_L - 6} y={sy(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--text-tertiary)">{v.toFixed(0)}m</text>
            </g>
          ))}
          <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--border-secondary)" strokeWidth={1} />

          <path d={groundArea} fill={GROUND_COLOR} opacity={0.18} stroke="none" />
          <path d={groundPath} fill="none" stroke={GROUND_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={waterArea} fill={WATER_COLOR} opacity={0.15} stroke="none" />
          <path d={waterPath} fill="none" stroke={WATER_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          <text x={PAD_L} y={H - 8} fontSize={9} fill="var(--text-tertiary)">0m</text>
          <text x={W - PAD_R} y={H - 8} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{lengthM.toFixed(0)}m</text>
        </svg>

        <div style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", marginTop: 6 }}>
          Demo data — no real DEM or hydraulic model behind this prototype.
        </div>
      </div>
    </div>
  );
}
