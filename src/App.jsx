import { useState, useEffect, useMemo, useRef } from "react";
import OSWindow from "./components/OSWindow.jsx";
import ModeRibbon, { modes } from "./components/ModeRibbon.jsx";
import PanelSlot from "./components/PanelSlot.jsx";
import GisCanvas from "./components/GisCanvas.jsx";
import KeyboardShortcuts from "./components/KeyboardShortcuts.jsx";
import AnnotationSettings from "./components/AnnotationSettings.jsx";
import { ToolboxPanelBody } from "./components/ToolboxPanel.jsx";
import { A, Icon } from "./assets.jsx";
import { resolveReaches } from "./reaches.js";
import { mockFlowForEdge } from "./flowMock.js";

// Nodes/edges are owned here (not inside GisCanvas) so the live network list
// in NetworkPanel can mirror exactly what's on the canvas.
const INIT_NODES = [
  { id: "n0", icon: "flowTime",     shape: "square",  x: 300, y: 40,  label: "M014",  unitLabel: "Flow-Time" },
  { id: "n1", icon: "crossSection", shape: "square",  x: 350, y: 108, label: "M015",  unitLabel: "River Section" },
  { id: "n2", icon: "interpolate",  shape: "diamond", x: 400, y: 176, label: "M0155", unitLabel: "Interpolate" },
  { id: "n3", icon: "crossSection", shape: "square",  x: 450, y: 244, label: "M016",  unitLabel: "River Section" },
  { id: "n4", icon: "calcPointWeir",shape: "square",  x: 505, y: 312, label: "M017",  unitLabel: "Calc Point Weir" },
  { id: "n5", icon: "interpolate",  shape: "diamond", x: 560, y: 380, label: "M0175", unitLabel: "Interpolate" },
  { id: "n6", icon: "crossSection", shape: "square",  x: 615, y: 448, label: "M018",  unitLabel: "River Section" },
  { id: "n7", icon: "normalDepth",  shape: "square",  x: 670, y: 516, label: "M026",  unitLabel: "Normal Depth" },
];
const INIT_EDGES = [["n0","n1"],["n1","n2"],["n2","n3"],["n3","n4"],["n4","n5"],["n5","n6"],["n6","n7"]]
  .map((e, i) => ({ id: "e" + i, from: e[0], to: e[1], points: [] }));

const PANEL_MIN = 180, PANEL_MAX = 520;

// Thin vertical drag bar between a side panel and the canvas; `onDrag`
// receives the per-move pixel delta (positive = pointer moved right).
function ResizeHandle({ onDrag }) {
  const onDown = (e) => {
    e.preventDefault();
    let lastX = e.clientX;
    const onMove = (ev) => { onDrag(ev.clientX - lastX); lastX = ev.clientX; };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div onMouseDown={onDown} title="Drag to resize" style={{
      width: 10, flexShrink: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 2, height: 32, borderRadius: 1, background: "var(--border-secondary)" }} />
    </div>
  );
}

// Blender-style "drag the gap between panels to reveal a new one". Both
// grips use the same rule: while the panel starts closed (size 0), a small
// release just snaps back shut instead of leaving an awkward sliver open —
// once it's actually open, dragging back down/right to 0 closes it too, no
// separate snap needed.
const REVEAL_MAX = 400, REVEAL_OPEN_MIN = 80, REVEAL_CANCEL_BELOW = 40;

// Invisible strip overlaid on the canvas's bottom edge — takes no layout
// space of its own (position:absolute, not in flow), so the canvas sits
// flush with the same padding as every other panel until this is actually
// dragged. Drag up to reveal the bottom-docked panel, down to shrink it.
function BottomRevealHandle({ height, setHeight }) {
  const onDown = (e) => {
    e.preventDefault();
    const wasOpen = height > 0;
    let lastY = e.clientY;
    const onMove = (ev) => {
      const dy = lastY - ev.clientY; // dragging up = positive
      lastY = ev.clientY;
      setHeight((h) => Math.max(0, Math.min(REVEAL_MAX, h + dy)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!wasOpen) setHeight((h) => (h < REVEAL_CANCEL_BELOW ? 0 : Math.max(REVEAL_OPEN_MIN, h)));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div onMouseDown={onDown} title="Drag up to reveal the Global Animator panel" style={{
      position: "absolute", left: 0, right: 0, bottom: height, height: 8, cursor: "row-resize", zIndex: 15,
    }} />
  );
}

// Invisible hit-zone tucked into the canvas's top-right corner, inside the
// 12px inset before the North/Zoom/Pan nav buttons start — so it never
// overlaps or displaces them. No visible icon; drag left to reveal a new
// vertical panel between the canvas and the right-hand panel, switchable
// via its own title dropdown like any other panel slot.
function CornerRevealGrip({ width, setWidth }) {
  const onDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasOpen = width > 0;
    let lastX = e.clientX;
    const onMove = (ev) => {
      const dx = lastX - ev.clientX; // dragging left = positive
      lastX = ev.clientX;
      setWidth((w) => Math.max(0, Math.min(REVEAL_MAX + 80, w + dx)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!wasOpen) setWidth((w) => (w < 60 ? 0 : Math.max(180, w)));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div onMouseDown={onDown} title="Drag left to reveal a new panel" style={{
      position: "absolute", top: 0, right: 0, width: 10, height: 10, cursor: "nwse-resize", zIndex: 20,
    }} />
  );
}

// Toolbox > "Open Toolbox..." (OS menu) pops this floating, draggable
// window on top of the UI — same ToolboxPanelBody the docked mid-panel
// slot uses, so search/expand state just isn't shared between the two
// (each is its own mount, matching how every other panel view works).
// The dock icon in its header hands off to the existing corner-panel slot
// (`midPanelView`/`midPanelW` — see CornerRevealGrip) instead of floating.
function FloatingToolbox({ pos, setPos, onDock, onClose }) {
  const onHeaderDown = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origin = pos;
    const onMove = (ev) => {
      setPos({ x: origin.x + (ev.clientX - startX), y: origin.y + (ev.clientY - startY) });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, width: 300, height: 680, maxHeight: "85vh", zIndex: 200,
      display: "flex", flexDirection: "column",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", overflow: "hidden",
    }}>
      <div
        onMouseDown={onHeaderDown}
        style={{
          display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 8px", flexShrink: 0,
          cursor: "grab", borderBottom: "1px solid var(--border-primary)", background: "var(--surface-2)",
        }}
      >
        <Icon src={A.toolboxHeaderIcon} size={16} />
        <span style={{ fontSize: "var(--fs-s)", fontWeight: 500, flex: "1 0 0" }}>Toolbox</span>
        <button onClick={onDock} title="Dock into layout" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: 4,
          display: "flex", alignItems: "center", color: "var(--text-tertiary)",
        }}>
          <Icon src={A.dock} size={12} style={{ filter: "invert(1)" }} />
        </button>
        <button onClick={onClose} title="Close" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, color: "var(--text-tertiary)",
        }}>×</button>
      </div>
      <ToolboxPanelBody />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("FM 1D");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [projectW, setProjectW] = useState(232);
  const [networkW, setNetworkW] = useState(232);
  // Which view each side panel slot currently shows — see PanelSlot.jsx's
  // PANEL_VIEWS registry. Defaults match the original fixed layout.
  const [leftView, setLeftView] = useState("project");
  const [rightView, setRightView] = useState("network");
  // Two more slots revealed by dragging the gaps around the canvas
  // (Blender-style area splitting) — both start closed (size 0).
  const [bottomPanelH, setBottomPanelH] = useState(0);
  const [bottomPanelView, setBottomPanelView] = useState("globalanimator");
  const [midPanelW, setMidPanelW] = useState(0);
  const [midPanelView, setMidPanelView] = useState("toolbox");
  // Toolbox > "Open Toolbox..." (OS menu) — floating/undocked window; see
  // FloatingToolbox above. Docking it hands off to the existing mid-panel
  // corner slot instead (`midPanelW`/`midPanelView`).
  const [toolboxFloat, setToolboxFloat] = useState(false);
  const [toolboxPos, setToolboxPos] = useState({ x: 420, y: 90 });
  const [nodes, setNodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState(INIT_EDGES);
  // Shared with NetworkPanel so a row click selects the node on the canvas.
  // Array of node ids — supports multi-select (Ctrl+click, box-select).
  const [selected, setSelected] = useState([]);
  // Basemap selection ("none" | "osm" | ...), driven by the Home tab's
  // Basemap dropdown and read by GisCanvas to render the backdrop. Only
  // "none"/"osm" are real; `lastBasemap` remembers the last non-none pick so
  // the B shortcut can toggle Grid <-> that basemap.
  const [basemap, setBasemapRaw] = useState("none");
  const lastBasemapRef = useRef("osm");
  const setBasemap = (id) => {
    if (id !== "none") lastBasemapRef.current = id;
    setBasemapRaw(id);
  };
  const toggleBasemap = () => setBasemapRaw((b) => (b === "none" ? lastBasemapRef.current : "none"));
  // One-shot "pan/zoom here" request from the top-bar location search — same
  // consume-once pattern as ribbonDrag. Turning on the OSM backdrop when a
  // location is picked gives the jump somewhere to actually land visually.
  const [flyTo, setFlyTo] = useState(null);
  const goToLocation = (lat, lon) => {
    setFlyTo({ lat, lon, key: Date.now() });
    if (basemap === "none") setBasemap("osm");
  };
  // In-progress ribbon → canvas drag: { items, index, x, y }. Shared between
  // ModeRibbon/OSWindow (start it, cycle it with Tab) and GisCanvas (consumes it on drop).
  const [ribbonDrag, setRibbonDrag] = useState(null);
  const dragActive = !!ribbonDrag;
  const beginDrag = (e, items, index) => setRibbonDrag({ items, index, x: e.clientX, y: e.clientY });

  // Home tab's Add Content annotation tools: `annotateTool` is armed from
  // the ribbon and read by GisCanvas, which owns the actual draw/place
  // interactions; `annotations` is the persisted list (text/marker/
  // highlighter/arrow), `annotationStyle` the default colour/width for the
  // next stroke, editable via the Annotation settings modal.
  const [annotateTool, setAnnotateTool] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [annotationStyle, setAnnotationStyle] = useState({
    markerColor: "#2f6fed", markerWidth: 3,
    highlighterColor: "#ff6100", highlighterWidth: 14,
    arrowColor: "#e1455b",
  });
  const [showAnnotationSettings, setShowAnnotationSettings] = useState(false);

  // View > Flow Lines: `flowLinesOn` gates the pulse animation + the
  // bottom-right velocity widget on the canvas. `flowByEdge` is demo-only
  // per-edge flow data (no real hydraulic model), stable per edge id so it
  // doesn't jitter on every render. The three sub-toggles + velocity range
  // are shared between GisCanvas (rendering) and the Flow Lines side panel
  // (controls) — see PanelSlot.jsx's "flowlines" view.
  const [flowLinesOn, setFlowLinesOn] = useState(false);
  const [flowWidgetOpen, setFlowWidgetOpen] = useState(true);
  const [velocityRange, setVelocityRange] = useState({ min: 0.01, max: 0.99 });
  const [clipOutOfRange, setClipOutOfRange] = useState(false);
  const [flowLabelsOn, setFlowLabelsOn] = useState(false);
  const [flowLabelMetric, setFlowLabelMetric] = useState("rateLps");
  const [flowTracerOn, setFlowTracerOn] = useState(false);
  const flowByEdge = useMemo(
    () => Object.fromEntries(edges.map((e) => [e.id, mockFlowForEdge(e.id)])),
    [edges],
  );
  useEffect(() => {
    if (flowLinesOn) setFlowWidgetOpen(true);
  }, [flowLinesOn]);

  // Reaches (map view line colour + table grouping) computed once here so
  // GisCanvas and NetworkPanel agree on exactly the same grouping. Users can
  // manually reassign a stretch (edge.reach) which overrides the automatic
  // topology-based grouping — see reaches.js. Custom names layer on top of
  // the auto "Reach N" names, keyed by the same stable reach key.
  const [reachNames, setReachNames] = useState({});
  const { registry: autoRegistry, edgeColors, edgesByKey, resolvedKeyByEdge, degree } = useMemo(() => resolveReaches(nodes, edges), [nodes, edges]);
  const registry = useMemo(
    () => autoRegistry.map(r => reachNames[r.key] ? { ...r, name: reachNames[r.key] } : r),
    [autoRegistry, reachNames],
  );
  const reassignReach = (edgeIds, reachKey) => {
    setEdges(es => es.map(e => edgeIds.includes(e.id) ? { ...e, reach: reachKey || undefined } : e));
  };
  const renameReach = (key, name) => {
    setReachNames(rn => ({ ...rn, [key]: name }));
  };

  // Keyboard Shortcuts spec (FM v8.0): General section — mode tabs, search
  // focus, and this shortcuts reference itself.
  useEffect(() => {
    const isTyping = (e) => {
      const t = (e.target.tagName || "").toLowerCase();
      return t === "input" || t === "textarea";
    };
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("fm-global-search")?.focus();
        return;
      }
      if (e.ctrlKey && !e.shiftKey && !isTyping(e) && /^[1-9]$/.test(e.key)) {
        const target = modes[Number(e.key) - 1];
        if (target) { e.preventDefault(); setMode(target); }
      }
      // Toggle the map backdrop between the grid and the last-selected
      // basemap — same bare-letter convention as the canvas's V/G/M/Q/X/Z
      // tool shortcuts (see GisCanvas), so it lives here rather than there
      // since the basemap selection itself is owned by App.
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleBasemap();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dragActive) return;
    const onMove = (e) => setRibbonDrag(rd => rd && { ...rd, x: e.clientX, y: e.clientY });
    const onKey = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setRibbonDrag(rd => {
          if (!rd || rd.items.length < 2) return rd;
          const dir = e.shiftKey ? -1 : 1;
          return { ...rd, index: (rd.index + dir + rd.items.length) % rd.items.length };
        });
      } else if (e.key === "Escape") {
        setRibbonDrag(null);
      }
    };
    // Fallback clear for a release outside the canvas; GisCanvas's own
    // mouseup (fired first, during bubbling) already consumes+clears a drop
    // that lands on it, so this only fires for drops elsewhere.
    const onUp = () => setRibbonDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragActive]);

  // Shared with BOTH panel slots (either side can show either view — see
  // PanelSlot.jsx) so switching a slot's view never leaves a Body without
  // the props it needs.
  const panelBodyProps = {
    nodes, edges, selected, setSelected,
    edgeColors, reachRegistry: registry, reachKeyOfEdge: resolvedKeyByEdge, onRenameReach: renameReach,
    flowByEdge, velocityRange, setVelocityRange, clipOutOfRange, setClipOutOfRange,
    flowLabelsOn, setFlowLabelsOn, flowLabelMetric, setFlowLabelMetric, flowTracerOn, setFlowTracerOn,
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-3)", overflow: "hidden" }}>
      <OSWindow onBeginDrag={beginDrag} onOpenShortcuts={() => setShowShortcuts(true)} onGoToLocation={goToLocation}
        flowLinesOn={flowLinesOn} setFlowLinesOn={setFlowLinesOn} onOpenToolbox={() => setToolboxFloat(true)}
        basemap={basemap} setBasemap={setBasemap} />
      <ModeRibbon onBeginDrag={beginDrag} mode={mode} setMode={setMode} basemap={basemap} setBasemap={setBasemap}
        annotateTool={annotateTool} setAnnotateTool={setAnnotateTool}
        onOpenAnnotationSettings={() => setShowAnnotationSettings(true)} />
      <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", padding: 8 }}>
        <PanelSlot width={projectW} viewId={leftView} onChangeView={setLeftView} bodyProps={panelBodyProps}
          onUndockToolbox={() => { setToolboxFloat(true); setLeftView("project"); }} />
        <ResizeHandle onDrag={(dx) => setProjectW(w => Math.max(PANEL_MIN, Math.min(PANEL_MAX, w + dx)))} />

        {/* Canvas column: map + (optionally) the bottom-docked panel below
            it. The corner grip lives here so it tracks the canvas's actual
            top-right corner regardless of how wide the mid panel gets. */}
        <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", position: "relative", gap: 8 }}>
          <GisCanvas
            nodes={nodes} setNodes={setNodes}
            edges={edges} setEdges={setEdges}
            selected={selected} setSelected={setSelected}
            basemap={basemap}
            flyTo={flyTo} onConsumeFlyTo={() => setFlyTo(null)}
            ribbonDrag={ribbonDrag} onConsumeRibbonDrag={() => setRibbonDrag(null)}
            edgeColors={edgeColors} degree={degree} reachRegistry={registry} edgesByReach={edgesByKey}
            reachKeyOfEdge={resolvedKeyByEdge} onReassignReach={reassignReach}
            annotateTool={annotateTool} setAnnotateTool={setAnnotateTool}
            annotations={annotations} setAnnotations={setAnnotations} annotationStyle={annotationStyle}
            flowLinesOn={flowLinesOn} flowByEdge={flowByEdge} velocityRange={velocityRange} setVelocityRange={setVelocityRange}
            clipOutOfRange={clipOutOfRange} flowLabelsOn={flowLabelsOn} flowLabelMetric={flowLabelMetric} flowTracerOn={flowTracerOn}
            flowWidgetOpen={flowWidgetOpen} setFlowWidgetOpen={setFlowWidgetOpen}
            onOpenFlowLinesPanel={() => setRightView("flowlines")}
          />
          <CornerRevealGrip width={midPanelW} setWidth={setMidPanelW} />
          <BottomRevealHandle height={bottomPanelH} setHeight={setBottomPanelH} />
          {bottomPanelH > 0 && (
            <PanelSlot height={bottomPanelH} viewId={bottomPanelView} onChangeView={setBottomPanelView}
              bodyProps={panelBodyProps} onClose={() => setBottomPanelH(0)}
              onUndockToolbox={() => { setToolboxFloat(true); setBottomPanelH(0); }} />
          )}
        </div>

        {midPanelW > 0 && (
          <>
            <ResizeHandle onDrag={(dx) => setMidPanelW(w => Math.max(0, Math.min(REVEAL_MAX + 80, w - dx)))} />
            <PanelSlot width={midPanelW} viewId={midPanelView} onChangeView={setMidPanelView}
              bodyProps={panelBodyProps} onClose={() => setMidPanelW(0)}
              onUndockToolbox={() => { setToolboxFloat(true); setMidPanelW(0); }} />
          </>
        )}

        <ResizeHandle onDrag={(dx) => setNetworkW(w => Math.max(PANEL_MIN, Math.min(PANEL_MAX, w - dx)))} />
        <PanelSlot width={networkW} viewId={rightView} onChangeView={setRightView} bodyProps={panelBodyProps}
          onUndockToolbox={() => { setToolboxFloat(true); setRightView("network"); }} />
      </div>

      {ribbonDrag && (
        <div style={{
          position: "fixed", left: ribbonDrag.x, top: ribbonDrag.y, transform: "translate(-50%, -50%)",
          zIndex: 999, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 4, background: "#fff", border: "1px solid var(--border-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon src={A[ribbonDrag.items[ribbonDrag.index].icon]} size={20} />
          </div>
          <div style={{ fontSize: "var(--fs-xxs)", background: "#333", color: "#fff", padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap" }}>
            {ribbonDrag.items[ribbonDrag.index].label}{ribbonDrag.items.length > 1 ? " · Tab to cycle" : ""}
          </div>
        </div>
      )}

      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      {toolboxFloat && (
        <FloatingToolbox
          pos={toolboxPos} setPos={setToolboxPos}
          onDock={() => { setMidPanelView("toolbox"); setMidPanelW((w) => (w > 0 ? w : 300)); setToolboxFloat(false); }}
          onClose={() => setToolboxFloat(false)}
        />
      )}
      {showAnnotationSettings && (
        <AnnotationSettings
          style={annotationStyle}
          onChange={(patch) => setAnnotationStyle((s) => ({ ...s, ...patch }))}
          onClose={() => setShowAnnotationSettings(false)}
        />
      )}
    </div>
  );
}
