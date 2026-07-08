import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { ProjectPanelBody } from "./ProjectPanel.jsx";
import { NetworkPanelBody } from "./NetworkPanel.jsx";
import { FlowLinesPanelBody } from "./FlowLinesPanel.jsx";
import { GlobalAnimatorBody } from "./GlobalAnimatorPanel.jsx";

// Every view a left/right panel slot can be switched to. Project, 1D
// Network, and Flow Lines have real content — the rest render a blank "not
// yet available" body but are still genuinely selectable, matching the
// Figma panel-switcher spec (fm-v8.0-panel-button) ahead of being built out.
export const PANEL_VIEWS = {
  project: { icon: "hierarchyLine", title: "Project", Body: ProjectPanelBody },
  network: { icon: "network", title: "1D Network", Body: NetworkPanelBody },
  glossary: { icon: "placeholder", title: "1D Glossary" },
  swmmnetwork: { icon: "placeholder", title: "1D SWMM Network" },
  results2d: { icon: "placeholder", title: "2D results" },
  globalanimator: { icon: "globalAnimatorIcon", title: "Global Animator", Body: GlobalAnimatorBody },
  timesteps: { icon: "placeholder", title: "Timesteps" },
  texteditor: { icon: "placeholder", title: "Text editor" },
  diagnostics1d: { icon: "placeholder", title: "1D Diagnostics" },
  toolbox: { icon: "placeholder", title: "Toolbox" },
  flowlines: { icon: "flowLinesIcon", title: "1D Flow Lines", Body: FlowLinesPanelBody },
};
const VIEW_ORDER = [
  "project", "network", "flowlines", "glossary", "swmmnetwork", "results2d",
  "globalanimator", "timesteps", "texteditor", "diagnostics1d", "toolbox",
];

function PanelSwitcher({ viewId, onChangeView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Switch panel view"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 24,
          padding: 4, borderRadius: 2, background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          cursor: "pointer",
        }}
      >
        <Icon src={A[PANEL_VIEWS[viewId].icon]} size={16} />
        <Icon src={A.keyDown} size={12} style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: "100%", left: 0, marginTop: 2, minWidth: 190, zIndex: 50,
            background: "var(--surface-1)", border: "1px solid var(--border-primary)",
            borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 4,
            display: "flex", flexDirection: "column", gap: 2,
          }}
        >
          {VIEW_ORDER.map((id) => {
            const v = PANEL_VIEWS[id];
            const active = id === viewId;
            return (
              <button
                key={id}
                onClick={() => { onChangeView(id); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, height: 28, padding: "4px 8px",
                  border: "none", borderRadius: 2, cursor: "pointer", textAlign: "left",
                  background: active ? "var(--surface-4)" : "transparent",
                  fontSize: "var(--fs-xs)", color: "var(--text-primary)",
                }}
                onMouseOver={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-3)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = active ? "var(--surface-4)" : "transparent"; }}
              >
                <Icon src={A[v.icon]} size={16} />
                {v.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PanelHeader({ viewId, onChangeView, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "4px 8px 4px 4px", flexShrink: 0 }}>
      <PanelSwitcher viewId={viewId} onChangeView={onChangeView} />
      <span style={{ fontSize: "var(--fs-s)", fontWeight: 500 }}>{PANEL_VIEWS[viewId].title}</span>
      <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <Icon src={A.labelFilter} size={12} />
        <Icon src={A.layers} size={12} />
        {onClose && (
          <button onClick={onClose} title="Close panel" style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, color: "var(--text-tertiary)" }}>×</button>
        )}
      </div>
    </div>
  );
}

function BlankBody({ title }) {
  return (
    <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{title} — not yet available</span>
    </div>
  );
}

// Generic left/right panel shell: owns the frame + switcher header, and
// renders whichever view is currently selected. `bodyProps` is forwarded
// to the active view's Body component (unused props are simply ignored by
// views that don't need them, e.g. the blank stub views).
// `width` for a vertical sidebar slot (left/right/mid), `height` for a
// horizontal slot docked along the bottom (Global Animator) — whichever
// isn't given defaults to 100% so the slot fills its flex container.
export default function PanelSlot({ width, height, viewId, onChangeView, bodyProps, onClose }) {
  const view = PANEL_VIEWS[viewId];
  const Body = view.Body;
  return (
    <div style={{
      width: width ?? "100%", height: height ?? "100%", flexShrink: 0, minWidth: 0, minHeight: 0,
      display: "flex", flexDirection: "column",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4, overflow: "hidden",
    }}>
      <PanelHeader viewId={viewId} onChangeView={onChangeView} onClose={onClose} />
      {Body ? <Body {...bodyProps} /> : <BlankBody title={view.title} />}
    </div>
  );
}
