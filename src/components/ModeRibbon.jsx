import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";

const modes = ["Home", "FM 1D", "FM 2D", "TUFLOW", "SWMM", "Hydrology+", "GIS", "Simulation", "Results", "Favourites"];
const ACTIVE_MODE = "FM 1D";

// Ribbon groups. Leaf items with `drag:true` can be dragged onto the canvas.
// `icon` is a key into A; items without a real uploaded asset use "placeholder".
export const RIBBON = [
  { id: "rivernet", icon: "load1d", label: "River Network", chevron: true, primary: true },
  { sep: true },
  { id: "river", icon: "crossSection", label: "River", selected: true, menu: [
    { label: "River Section", icon: "crossSection", shape: "square", drag: true },
    { label: "CES Section",   icon: "placeholder",  shape: "square", drag: true },
    { label: "Interpolate",   icon: "interpolate",  shape: "diamond", drag: true },
    { label: "Replicate",     icon: "placeholder",  shape: "diamond", drag: true },
    { label: "Muskingum",     icon: "placeholder",  sub: [
      { label: "Muskingum",   icon: "placeholder", shape: "square", drag: true },
      { label: "Muskingum R", icon: "placeholder", shape: "square", drag: true },
      { label: "Muskingum V", icon: "placeholder", shape: "square", drag: true },
      { label: "Muskingum X", icon: "placeholder", shape: "square", drag: true },
    ] },
  ] },
  { sep: true },
  { id: "conduits", icon: "circularArch", label: "Conduits", menu: [
    { label: "Circular / Arch", icon: "circularArch", shape: "square", drag: true },
  ] },
  { sep: true },
  { id: "boundaries", icon: "flowTime", label: "Boundaries", menu: [
    { label: "Hydrographs", icon: "placeholder", sub: [
      { label: "Flow-Time",              icon: "flowTime",    shape: "square", drag: true },
      { label: "Generic Rainfall/Runoff",icon: "placeholder", shape: "square", drag: true },
      { label: "FEH",                    icon: "placeholder", shape: "square", drag: true },
      { label: "ReFH",                   icon: "placeholder", shape: "square", drag: true },
      { label: "ReFH2",                  icon: "placeholder", shape: "square", drag: true },
      { label: "FRQSIM",                 icon: "placeholder", shape: "square", drag: true },
      { label: "FSSR",                   icon: "placeholder", shape: "square", drag: true },
    ] },
    { label: "Head-Time",          icon: "placeholder", shape: "square", drag: true },
    { label: "Rainfall Evaporation",icon: "placeholder", shape: "square", drag: true },
    { label: "Abstraction",        icon: "placeholder", shape: "square", drag: true },
    { label: "Tidal",              icon: "placeholder", shape: "square", drag: true },
    { label: "Flow-Head",          icon: "placeholder", shape: "square", drag: true },
    { label: "Normal Depth",       icon: "normalDepth", shape: "square", drag: true },
  ] },
  { sep: true },
  { id: "weirs",   icon: "broadWeir",    label: "Weirs",    menu: [{ label: "Broad Crested Weir", icon: "broadWeir",    shape: "square", drag: true }] },
  { sep: true },
  { id: "bridges", icon: "superBridge",  label: "Bridges",  menu: [{ label: "Super Bridge",       icon: "superBridge",  shape: "square", drag: true }] },
  { sep: true },
  { id: "storage", icon: "spill",        label: "Storage",  menu: [{ label: "Spill",              icon: "spill",        shape: "square", drag: true }] },
  { sep: true },
  { id: "junction",icon: "openJunction", label: "Junction", menu: [{ label: "Open Junction",      icon: "openJunction", shape: "square", drag: true }] },
  { sep: true },
  { id: "advanced",icon: "blockage",     label: "Advanced", menu: [{ label: "Blockage",           icon: "blockage",     shape: "square", drag: true }] },
  { sep: true },
  { id: "viewlabels", icon: "labelsColor", label: "View labels", chevron: true },
  { id: "rules",      icon: "rulesColor",  label: "Rules" },
  { sep: true },
  { id: "settings",   icon: "settingsColor", label: "FM 1D settings" },
];

// Flattened list of every draggable leaf unit, annotated with its ribbon
// group / sub-group path (`group`, for display) and its top-level group
// (`top`) — used by the canvas quick-add picker and by the ribbon's
// press-and-hold-Tab cycle group.
export function flattenRibbonItems() {
  const out = [];
  const walk = (items, group, top) => {
    items.forEach((it) => {
      if (it.sub) walk(it.sub, `${group} / ${it.label}`, top);
      else if (it.drag) out.push({ icon: it.icon, shape: it.shape || "square", label: it.label, group, top });
    });
  };
  RIBBON.forEach((g) => { if (g.menu) walk(g.menu, g.label, g.label); });
  return out;
}

const ALL_ITEMS = flattenRibbonItems();

function Sep() {
  return <div style={{ width: 1, height: 32, background: "var(--border-primary)", margin: "0 4px", flexShrink: 0 }} />;
}

// Leaf items use a plain mousedown-driven drag (not native HTML5 DnD) so the
// in-progress drag can respond to a held Tab key to cycle the armed unit —
// browsers largely swallow keydown while a native drag session is active.
function MenuItem({ item, groupItems, onBeginDrag, onCloseAll }) {
  const [subOpen, setSubOpen] = useState(false);
  const hasSub = !!item.sub;
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => hasSub && setSubOpen(true)}
      onMouseLeave={() => hasSub && setSubOpen(false)}
    >
      <div
        onMouseDown={item.drag ? (e) => {
          e.preventDefault();
          onCloseAll();
          const startIndex = Math.max(0, groupItems.findIndex((g) => g.label === item.label));
          onBeginDrag(e, groupItems, startIndex);
        } : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
          cursor: item.drag ? "grab" : "default", whiteSpace: "nowrap", borderRadius: 2,
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        title={item.drag ? "Drag onto the canvas to place (hold Tab to cycle the type)" : undefined}
      >
        <Icon src={A[item.icon]} size={16} />
        <span style={{ fontSize: "var(--fs-xs)", flex: "1 0 0" }}>{item.label}</span>
        {hasSub && <Icon src={A.keyDown} size={12} style={{ transform: "rotate(-90deg)", opacity: 0.6 }} />}
      </div>
      {hasSub && subOpen && (
        <div style={{
          position: "absolute", top: -5, left: "100%", minWidth: 190,
          background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 4, zIndex: 60,
        }}>
          {item.sub.map((s) => (
            <MenuItem key={s.label} item={s} groupItems={groupItems} onBeginDrag={onBeginDrag} onCloseAll={onCloseAll} />
          ))}
        </div>
      )}
    </div>
  );
}

function RibbonGroup({ group, open, setOpen, onBeginDrag }) {
  const ref = useRef(null);
  const hasMenu = !!group.menu;
  const isOpen = open === group.id;
  const groupItems = hasMenu ? ALL_ITEMS.filter((it) => it.top === group.label) : [];

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
      <button
        onClick={() => hasMenu ? setOpen(isOpen ? null : group.id) : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 32, padding: "0 8px",
          border: "none", borderRadius: 2, cursor: "pointer",
          background: (group.selected || isOpen) ? "var(--surface-4)" : "transparent",
          color: (group.selected || group.primary) ? "var(--text-primary-selected)" : "var(--text-primary)",
        }}
      >
        <Icon src={A[group.icon]} size={16} />
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, whiteSpace: "nowrap" }}>{group.label}</span>
      </button>
      {(hasMenu || group.chevron) && (
        <div
          onClick={() => hasMenu ? setOpen(isOpen ? null : group.id) : undefined}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 32, padding: "0 4px", cursor: "pointer", background: isOpen ? "var(--surface-4)" : "transparent", borderRadius: 2 }}
        >
          <Icon src={A.keyDown} size={12} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
        </div>
      )}
      {hasMenu && isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 2, minWidth: 210,
          background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 4, zIndex: 50,
        }}>
          {group.menu.map((it) => (
            <MenuItem key={it.label} item={it} groupItems={groupItems} onBeginDrag={onBeginDrag} onCloseAll={() => setOpen(null)} />
          ))}
        </div>
      )}
    </div>
  );
}

// `onBeginDrag(e, groupItems, startIndex)` — called when a leaf item's drag
// starts; the parent (App) owns the shared in-progress drag state so both
// the ribbon and the canvas can see it (needed for Tab-cycling + drop).
export default function ModeRibbon({ onBeginDrag }) {
  const [open, setOpen] = useState(null);
  const barRef = useRef(null);

  // Close any open menu on outside click / Escape
  useEffect(() => {
    const onDown = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setOpen(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div style={{ flexShrink: 0, padding: "0 8px", background: "var(--surface-1)", position: "relative", zIndex: 30 }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", alignItems: "center", height: 32, paddingLeft: 16 }}>
        {modes.map((m) => {
          const active = m === ACTIVE_MODE;
          return (
            <button key={m} style={{
              height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px",
              border: "none", background: "transparent", cursor: "pointer",
              borderBottom: active ? "2px solid var(--surface-brand)" : "2px solid transparent",
              color: active ? "var(--text-primary-selected)" : "var(--text-primary)",
              fontSize: "var(--fs-xs)", fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
            }}>{m}</button>
          );
        })}
        <div style={{ flex: "1 0 0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 16, padding: "4px 6px", borderRadius: 16, background: "var(--surface-3)", border: "2px solid var(--surface-3)" }}>
          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Flood Platform</span>
          <Icon src={A.refresh} size={12} />
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 8 }}>
          <Icon src={A.userProfile} size={16} />
          <div style={{ display: "flex", alignItems: "center", height: 32, padding: "0 2px", cursor: "pointer" }}>
            <Icon src={A.keyDown} size={12} />
          </div>
        </div>
      </div>

      {/* Tool ribbon */}
      <div ref={barRef} style={{
        display: "flex", alignItems: "center", gap: 8, height: 48, padding: 8,
        border: "1px solid var(--border-primary)", borderRadius: 4, background: "var(--surface-1)",
        overflowX: "visible",
      }}>
        {RIBBON.map((g, i) => g.sep ? <Sep key={i} /> : <RibbonGroup key={g.id} group={g} open={open} setOpen={setOpen} onBeginDrag={onBeginDrag} />)}
      </div>
    </div>
  );
}
