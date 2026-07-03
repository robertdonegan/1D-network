import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";

export const modes = ["Home", "FM 1D", "FM 2D", "TUFLOW", "SWMM", "Hydrology+", "GIS", "Simulation", "Results", "Favourites"];

// Home tab's ribbon — project-level actions rather than 1D network units,
// so none of these are draggable onto the canvas.
export const HOME_RIBBON = [
  { id: "saveproject",    icon: "homeLoadFile",   label: "Save project",    chevron: true },
  { sep: true },
  { id: "projectextents", icon: "homeExpand",     label: "Project extents", chevron: true },
  { id: "bookmarks",      icon: "homeAddBookmark",label: "Bookmarks",       chevron: true },
  { id: "notes",          icon: "homeNote",       label: "Notes",          chevron: true },
  { id: "addcontent",     icon: "homeMarker",     label: "Add content",    chevron: true },
  { sep: true },
  { id: "addgisdata",     icon: "homeAddGis",     label: "Add GIS data",   chevron: true },
  { id: "basemap",        icon: "homeGoToMap",    label: "Basemap",        chevron: true },
  { id: "onlineservices", icon: "homeMapView",    label: "Online services",chevron: true },
  { id: "fathom",         icon: "homeFathom",     label: "Fathom",         chevron: true },
  { sep: true },
  { id: "projectsettings",icon: "settingsColor",  label: "Project settings" },
];

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

// Remaining mode ribbons — mostly project/tool actions rather than 1D
// network units, so (aside from the two Favourites shortcuts back to real
// FM1D unit types) these are visual-only, matching the Home tab's treatment
// of not-yet-wired actions. Icons without a real uploaded asset use
// "placeholder", same convention as the FM1D ribbon above.
export const FM_2D_RIBBON = [
  { id: "activearea", icon: "ribbonActiveArea", label: "Active area", chevron: true },
  { id: "boundarycondition2d", icon: "ribbonBoundaryCondition", label: "Boundary condition" },
  { id: "definetopo", icon: "ribbonDefineTopo", label: "Define topography" },
  { sep: true },
  { id: "1dstructure", icon: "ribbon1dEmbed", label: "1D structure" },
  { sep: true },
  { id: "1d2dlink", icon: "ribbon1d2dLink", label: "1D-2D link", chevron: true },
  { sep: true },
  { id: "polyline2d", icon: "ribbonPolyline", label: "Polyline", chevron: true },
  { id: "zmod", icon: "ribbonZmod", label: "Z-mod", chevron: true },
  { sep: true },
  { id: "genimesh", icon: "ribbonGenImesh", label: "Generate iMesh" },
  { id: "modimesh", icon: "ribbonModImesh", label: "Modify iMesh", chevron: true },
];

export const TUFLOW_RIBBON = [
  { id: "codelayer", icon: "ribbonActiveArea", label: "Code layer" },
  { id: "boundaryconditiontf", icon: "ribbonBoundaryCondition", label: "Boundary condition", chevron: true },
  { id: "topomod", icon: "ribbonDefineTopo", label: "Topographic modification", chevron: true },
  { sep: true },
  { id: "estry1d", icon: "ribbon1dEmbed", label: "Estry 1D", chevron: true },
  { sep: true },
  { id: "1dtuflowlink", icon: "ribbon1d2dLink", label: "1D-TUFLOW link", chevron: true },
  { sep: true },
  { id: "importtf", icon: "ribbonImport", label: "Import", chevron: true },
  { sep: true },
  { id: "polylinetf", icon: "ribbonPolyline", label: "Polyline" },
  { id: "polygontf", icon: "ribbonPolygon", label: "Polygon" },
  { id: "pointstf", icon: "ribbonPoint", label: "Points" },
  { sep: true },
  { id: "tuflowtools", icon: "ribbonTools", label: "Tools", chevron: true },
];

export const SWMM_RIBBON = [
  { id: "loadswmm", icon: "homeLoadFile", label: "Load SWMM Network", chevron: true },
  { sep: true },
  { id: "swmm1dlink", icon: "ribbonSwmm1dLink", label: "FM 1D-SWMM link" },
  { id: "swmm2dlink", icon: "ribbonSwmm2dLink", label: "SWMM-2D link" },
  { sep: true },
  { id: "viewlabelsswmm", icon: "ribbonViewLabels", label: "View labels", chevron: true },
  { sep: true },
  { id: "editnodes", icon: "ribbonEditNode", label: "Edit nodes", chevron: true },
  { sep: true },
  { id: "selectionmode", icon: "ribbonSelectionMode", label: "Selection mode" },
  { sep: true },
  { id: "addlink", icon: "ribbonAddLink", label: "Add link" },
  { sep: true },
  { id: "swmmnodes", icon: "ribbonSwmmNode", label: "SWMM nodes", chevron: true },
];

export const HYDROLOGY_RIBBON = [
  { id: "hplusproject", icon: "placeholder", label: "Hydrology+ project", chevron: true },
  { id: "refhtools", icon: "placeholder", label: "ReFH tools", chevron: true },
  { id: "fsuportal", icon: "placeholder", label: "FSU Portal" },
  { id: "riverstations", icon: "placeholder", label: "View river stations", chevron: true },
  { id: "fehcatchments", icon: "placeholder", label: "FEH Catchment Descriptors", chevron: true },
  { id: "calcpoints", icon: "interpolate", label: "Calculation points" },
  { id: "hplussettings", icon: "settingsColor", label: "Hydrology+ settings" },
];

export const GIS_RIBBON = [
  { id: "rastertools", icon: "placeholder", label: "Raster tools (TBC)", chevron: true },
  { id: "vectortools", icon: "placeholder", label: "Vector tools (TBC)", chevron: true },
];

export const SIMULATION_RIBBON = [
  { id: "new1dsim", icon: "placeholder", label: "New 1D simulation", chevron: true },
  { id: "newqualsim", icon: "placeholder", label: "New Quality simulation" },
  { id: "new2dsim", icon: "placeholder", label: "New 2D simulation", chevron: true },
  { id: "newtuflowsim", icon: "placeholder", label: "New TUFLOW simulation", chevron: true },
  { id: "loadsim", icon: "homeLoadFile", label: "Load simulation" },
  { sep: true },
  { id: "simbuilder", icon: "placeholder", label: "Simulation Builder", chevron: true },
  { id: "runsim", icon: "placeholder", label: "Run simulation" },
  { id: "runbatch", icon: "placeholder", label: "Run Batch" },
];

export const RESULTS_RIBBON = [
  { id: "1dresults", icon: "placeholder", label: "1D results", chevron: true },
  { id: "1dfloodmap", icon: "placeholder", label: "1D flood map", chevron: true },
  { id: "tabularcsv", icon: "placeholder", label: "Tabular CSV" },
  { id: "load2dresults", icon: "placeholder", label: "Load 2D results" },
  { id: "2danalysis", icon: "placeholder", label: "2D analysis", chevron: true },
  { id: "2dfloodmap", icon: "placeholder", label: "2D flood map" },
  { id: "damagecalc", icon: "placeholder", label: "Damage calculator" },
  { sep: true },
  { id: "comments", icon: "comment", label: "Comments", chevron: true },
  { id: "spatialdiag", icon: "placeholder", label: "Spatial diagnostics" },
];

// Two of these link straight back to real FM1D unit types (same
// icon/shape), so — unlike the rest of this tab — they're genuinely
// draggable onto the canvas, not just visual chrome.
export const FAVOURITES_RIBBON = [
  { id: "1d2dmodelbuild", icon: "placeholder", label: "1D/2D Model Build", chevron: true },
  { id: "favriversection", icon: "crossSection", label: "River section", menu: [
    { label: "River Section", icon: "crossSection", shape: "square", drag: true },
  ] },
  { id: "favinterpolate", icon: "interpolate", label: "Interpolate", menu: [
    { label: "Interpolate", icon: "interpolate", shape: "diamond", drag: true },
  ] },
  { id: "favheadtime", icon: "placeholder", label: "Head-time" },
  { id: "favactivearea", icon: "ribbonActiveArea", label: "Active area" },
  { id: "fav1d2dlink", icon: "ribbon1d2dLink", label: "1D-2D link" },
];

const RIBBON_BY_MODE = {
  "Home": HOME_RIBBON,
  "FM 1D": RIBBON,
  "FM 2D": FM_2D_RIBBON,
  "TUFLOW": TUFLOW_RIBBON,
  "SWMM": SWMM_RIBBON,
  "Hydrology+": HYDROLOGY_RIBBON,
  "GIS": GIS_RIBBON,
  "Simulation": SIMULATION_RIBBON,
  "Results": RESULTS_RIBBON,
  "Favourites": FAVOURITES_RIBBON,
};

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
  // FAVOURITES_RIBBON also has a couple of draggable leaves (shortcuts back
  // to real FM1D unit types), so its groups resolve correctly too.
  [RIBBON, FAVOURITES_RIBBON].forEach((ribbon) => {
    ribbon.forEach((g) => { if (g.menu) walk(g.menu, g.label, g.label); });
  });
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
// `mode`/`setMode` — the active mode tab, also owned by App since it drives
// what ProjectPanel/NetworkPanel/GisCanvas show.
export default function ModeRibbon({ onBeginDrag, mode, setMode }) {
  const [open, setOpen] = useState(null);
  const barRef = useRef(null);
  const activeRibbon = RIBBON_BY_MODE[mode] || [];

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
          const active = m === mode;
          return (
            <button key={m} onClick={() => setMode(m)} style={{
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
        {activeRibbon.map((g, i) => g.sep ? <Sep key={i} /> : <RibbonGroup key={g.id} group={g} open={open} setOpen={setOpen} onBeginDrag={onBeginDrag} />)}
      </div>
    </div>
  );
}
