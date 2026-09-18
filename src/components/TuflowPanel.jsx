import { A, Icon } from "../assets.jsx";

// TUFLOW editor panel (Figma fm-v8.0-TUFLOW-editor + fm-v8.0-TUFLOW-tcf):
// TUFLOW mode's right-hand dock shows this wider editor in place of the 1D
// Network panel. It renders a syntax-coloured .tcf (control file) with a
// line-number gutter and a simulated "cmd line graph" spike on the right.
// The entries are demo control-file statements (same spirit as the rest of
// the fork) — there's no real TUFLOW engine behind them.

const MONO = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';
const SYN = { k: "#2d52d2", op: "#cc334f", v: "#333", c: "#0a8058" };

const TCF = [
  [["k", "GIS FORMAT"], ["op", " == "], ["v", "SHP"]],
  [["k", "SHP Protection"], ["op", " == "], ["v", "..\\model\\gis\\projection.prj"]],
  [["k", "Tutorial Model"], ["op", " == "], ["v", "ON"]],
  [["c", "!Write Empty GIS Files"], ["c", " == "], ["c", "..\\model\\gis\\empty"]],
  [],
  [["k", "Geometry Control File"], ["op", " == "], ["v", "..\\model\\Bris_5m_001.tgc"]],
  [["k", "Read Materials File"], ["op", " == "], ["v", "..\\model\\materials.csv"]],
  [],
  [["k", "Timestep"], ["op", " == "], ["v", "2"], ["v", "  (mins)"]],
  [["k", "Start Time"], ["op", " == "], ["v", "0"], ["v", "  (hrs from midnight)"]],
  [["k", "End Time"], ["op", " == "], ["v", "24"], ["v", "  (hrs from midnight)"]],
  [["k", "Data Output"], ["op", " == "], ["v", "..\\model\\output"]],
  [["k", "Output Control"], ["op", " == "], ["v", "..\\model\\output.scr"]],
];

// The design's standing "cmd line graph" (a gauge spike, 20px x 276px)
// drawn as a thin sparkline, synthetic and stable.
const SPARK = Array.from({ length: 49 }, (_, i) => {
  const t = i / 48;
  const surge = Math.exp(-Math.pow((t - 0.22) * 5.5, 2)) * 0.85;
  const base = 0.18 + 0.5 * t;
  return base + surge;
});
function CmdLineGraph() {
  const W = 20, H = 276;
  const pts = SPARK.map((v, i) => `${4 + (i / (SPARK.length - 1)) * 14},${H - 4 - v * H}`);
  const area = `M 4,${H - 4} L ${pts.join(" L ")} L 18,${H - 4} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <path d={area} fill="rgba(10,125,255,0.18)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#0a7dff" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function TuflowPanelBody() {
  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface-1)" }}>
      {/* Editor tab bar (fm-v8.0-TUFLOW-editor) */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 8px", flexShrink: 0,
        background: "var(--surface-2)", borderBottom: "1px solid var(--border-primary)",
      }}>
        <Icon src={A.tuflowEstry1d} size={14} style={{ filter: "brightness(0) saturate(100%) sepia(1) saturate(5) hue-rotate(195deg)" }} />
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, whiteSpace: "nowrap" }}>Upton_003_1D.tcf</span>
        <div style={{ flex: "1 0 0" }} />
        <Icon src={A.layers} size={12} style={{ opacity: 0.6 }} />
        <Icon src={A.cancel} size={10} style={{ opacity: 0.6 }} />
      </div>

      {/* TCF source */}
      <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{
          width: 34, flexShrink: 0, textAlign: "right", paddingRight: 8, paddingTop: 6,
          fontFamily: MONO, fontSize: 12, lineHeight: 1.6, color: "#999",
          background: "#fafafa", borderRight: "1px solid var(--border-primary)", userSelect: "none", overflow: "hidden",
        }}>
          {TCF.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div style={{ flex: "1 0 0", minWidth: 0, padding: "6px 12px", fontFamily: MONO, fontSize: 12, lineHeight: 1.6, overflow: "auto", whiteSpace: "pre" }}>
          {TCF.map((toks, i) => (
            <div key={i}>
              {toks.length === 0 ? "\u200b" : toks.map(([c, t], j) => (
                <span key={j} style={{ color: SYN[c] }}>{t}</span>
              ))}
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, alignSelf: "center", padding: "0 2px" }}>
          <CmdLineGraph />
        </div>
      </div>

      <div style={{ padding: "4px 8px", fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
        Demo TUFLOW control file — read-only in this prototype.
      </div>
    </div>
  );
}