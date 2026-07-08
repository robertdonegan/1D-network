import { A, Icon } from "../assets.jsx";
import { FLOW_LABEL_METRICS } from "../flowMock.js";

// Pixel-perfect FloodInlineToggle16px (Flood Component Library,
// node 4418:120373) — Off is bg neutral-600/border border-secondary with a
// bordered white knob + black X; On is Figma's blue/blue-800 (#3b6de6, not
// one of our own tokens) with a plain white knob + white check, knob and
// icon swapping sides rather than a knob sliding over a fixed icon.
function Toggle({ on, onClick }) {
  const knob = (
    <div style={{
      width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: "#fff",
      border: on ? "none" : "1px solid var(--border-secondary)",
    }} />
  );
  const icon = (
    <div style={{ width: 12, height: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon src={on ? A.toggleOnCheck : A.toggleOffX} size={12} />
    </div>
  );
  return (
    <button onClick={onClick} style={{
      width: 28, height: 16, borderRadius: 16, flexShrink: 0, cursor: "pointer", padding: 2,
      background: on ? "#3b6de6" : "var(--neutral-600)",
      border: on ? "none" : "1px solid var(--border-secondary)",
      display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", gap: 0,
    }}>
      {on ? <>{icon}{knob}</> : <>{knob}{icon}</>}
    </button>
  );
}

// Dashed "pulse" preview swatch — a static stand-in for the animated dash
// pattern drawn on the canvas lines, just to show slow vs fast at a glance.
// Actually animated (not just a static dash pattern) so "slowest" vs
// "fastest" is legible at a glance — a self-contained keyframe rather than
// relying on GisCanvas's, since this renders in the panel/widget whenever
// they're open, independent of whether Flow Lines itself is switched on.
export function PulsePreview({ fast }) {
  return (
    <svg width="100%" height="8" style={{ display: "block", flex: "1 0 0", minWidth: 0, overflow: "visible" }} preserveAspectRatio="none" viewBox="0 0 100 8">
      <style>{"@keyframes fm-pulse-preview { to { stroke-dashoffset: -20; } }"}</style>
      <line x1="0" y1="4" x2="100" y2="4" stroke="var(--interface-blue-500, #55c7ff)" strokeWidth="2" opacity="0.25" />
      <line
        x1="0" y1="4" x2="100" y2="4" stroke="var(--interface-blue-500, #55c7ff)" strokeWidth="4" strokeLinecap="round"
        strokeDasharray="4 6"
        style={{ animation: `fm-pulse-preview ${fast ? "0.5s" : "2.2s"} linear infinite` }}
      />
    </svg>
  );
}

function StubSelect({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 32, padding: "6px 8px",
      background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2,
    }}>
      <span style={{ flex: "1 0 0", fontSize: "var(--fs-s)", color: "var(--text-secondary)" }}>{label}</span>
      <Icon src={A.keyDown} size={16} style={{ opacity: 0.5 }} />
    </div>
  );
}

// Which data point Flow labels stamp along each reach — every field a
// modeller might plausibly want at a glance, not just the flow rate.
function MetricSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", height: 32, padding: "6px 8px", fontSize: "var(--fs-s)", color: "var(--text-primary)",
        background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2, cursor: "pointer",
      }}
    >
      {FLOW_LABEL_METRICS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
    </select>
  );
}

function SectionHeader({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 32, padding: "12px 8px 4px", flexShrink: 0 }}>
      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
    </div>
  );
}

export function editValue(current) {
  const raw = window.prompt("Velocity value (0–1):", String(current));
  if (raw == null) return current;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : current;
}

function RegimeBadge({ regime }) {
  const color = regime === "Subcritical" ? "var(--blue-700)" : regime === "Supercritical" ? "var(--red-700)" : "var(--text-tertiary)";
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: color, borderRadius: 2, padding: "1px 6px", flexShrink: 0 }}>
      {regime}
    </span>
  );
}

function DataRow({ label, value, strong }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: "var(--fs-xs)", fontWeight: strong ? 600 : 500, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

// Individual-vs-grouped selection cards. A single selected unit gets its
// own card (matching Figma's fm-v8-1d-unit-information, extended with the
// data points a hydraulic modeller actually checks a reach by — velocity,
// stage, depth, and Froude/flow-regime); multiple selected units are
// summarised as one totals card instead of a stack of N cards.
function SelectionCards({ nodes, edges, selected, flowByEdge }) {
  if (!selected.length) {
    return <div style={{ padding: "8px 0", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>No unit selected</div>;
  }
  const edgeForNode = (nodeId) => edges.find((e) => e.from === nodeId || e.to === nodeId);

  if (selected.length === 1) {
    const n = nodes.find((x) => x.id === selected[0]);
    if (!n) return null;
    const edge = edgeForNode(n.id);
    const flow = edge ? flowByEdge[edge.id] : null;
    const source = edge ? (nodes.find((x) => x.id === edge.from)?.unitLabel || "Network") : "—";
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: 8, padding: 10,
        background: "var(--surface-2)", border: "1px solid var(--surface-3)", borderRadius: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 4, background: "var(--surface-1)", border: "1px solid var(--border-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon src={A[n.icon]} size={16} />
          </div>
          <span style={{ fontSize: "var(--fs-s)", fontWeight: 600, color: "var(--text-primary)" }}>{n.label}</span>
          <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>{n.unitLabel}</span>
        </div>
        {flow ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <DataRow label="Flow (Q)" value={`${flow.rateLps.toFixed(2)} l/s`} strong />
              <DataRow label="Velocity" value={`${flow.velocity.toFixed(2)} m/s`} />
              <DataRow label="Water level" value={`${flow.waterLevelM.toFixed(2)} m AOD`} />
              <DataRow label="Depth" value={`${flow.depthM.toFixed(2)} m`} />
              <DataRow label="Bed level" value={`${flow.invertLevelM.toFixed(2)} m AOD`} />
              <DataRow label="Direction" value={flow.direction} />
              <DataRow label="Source" value={source} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--border-primary)" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Froude {flow.froude.toFixed(2)}</span>
              <RegimeBadge regime={flow.regime} />
            </div>
          </>
        ) : (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>No flow data</span>
        )}
      </div>
    );
  }

  const flows = selected.map((id) => { const e = edgeForNode(id); return e ? flowByEdge[e.id] : null; }).filter(Boolean);
  const total = flows.reduce((sum, f) => sum + f.rateLps, 0);
  const avgVelocity = flows.length ? flows.reduce((sum, f) => sum + f.velocity, 0) / flows.length : 0;
  const supercriticalCount = flows.filter((f) => f.regime === "Supercritical").length;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8, padding: 10,
      background: "var(--surface-2)", border: "1px solid var(--surface-3)", borderRadius: 2,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4, background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon src={A.layers} size={16} />
        </div>
        <span style={{ fontSize: "var(--fs-s)", fontWeight: 600, color: "var(--text-primary)" }}>{selected.length} units selected</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <DataRow label="Total flow (Q)" value={`${total.toFixed(2)} l/s`} strong />
        <DataRow label="Average velocity" value={`${avgVelocity.toFixed(2)} m/s`} />
        <DataRow label="Supercritical reaches" value={`${supercriticalCount} of ${flows.length}`} />
      </div>
    </div>
  );
}

// Body for the right panel's "Flow Lines" view (PanelSlot.jsx PANEL_VIEWS
// registry) — Line symbology / Line labels controls plus the current
// selection card(s). Same toggle state also drives GisCanvas's pulse
// animation, flow labels, and Flow Tracer highlight.
export function FlowLinesPanelBody({
  nodes = [], edges = [], selected = [], flowByEdge = {},
  velocityRange, setVelocityRange, clipOutOfRange, setClipOutOfRange,
  flowLabelsOn, setFlowLabelsOn, flowLabelMetric, setFlowLabelMetric, flowTracerOn, setFlowTracerOn,
}) {
  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <SectionHeader label="Line symbology" />
      <div style={{ padding: "0 8px" }}>
        <StubSelect label="Elevation" />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px" }}>
        <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)", flexShrink: 0 }}>Velocity</span>
        <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              onClick={() => setVelocityRange((r) => ({ ...r, min: editValue(r.min) }))}
              title="Click to edit"
              style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
            >
              {velocityRange.min.toFixed(2)} <Icon src={A.edit} size={12} />
            </span>
            <span
              onClick={() => setVelocityRange((r) => ({ ...r, max: editValue(r.max) }))}
              title="Click to edit"
              style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
            >
              {velocityRange.max.toFixed(2)} <Icon src={A.edit} size={12} />
            </span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <PulsePreview />
            <PulsePreview fast />
          </div>
        </div>
      </div>

      <div
        onClick={() => setClipOutOfRange((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 8px", cursor: "pointer" }}
      >
        <Toggle on={clipOutOfRange} />
        <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>Clip out of range</span>
      </div>

      <SectionHeader label="Line labels" />
      <div
        onClick={() => setFlowLabelsOn((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 8px", cursor: "pointer" }}
      >
        <Toggle on={flowLabelsOn} />
        <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>Flow labels</span>
      </div>
      <div style={{ padding: "0 8px" }}>
        <MetricSelect value={flowLabelMetric} onChange={setFlowLabelMetric} />
      </div>
      <div
        onClick={() => setFlowTracerOn((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "8px", cursor: "pointer" }}
      >
        <Toggle on={flowTracerOn} />
        <span style={{ fontSize: "var(--fs-s)", color: "var(--text-primary)" }}>Flow Tracer</span>
      </div>

      <SectionHeader label="Current selection" />
      <div style={{ padding: "0 8px 8px" }}>
        <SelectionCards nodes={nodes} edges={edges} selected={selected} flowByEdge={flowByEdge} />
      </div>
    </div>
  );
}
