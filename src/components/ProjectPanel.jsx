import { useState, useRef, Fragment } from "react";
import { A, Icon } from "../assets.jsx";
import ContextMenu from "./ContextMenu.jsx";
import { rampCss } from "./LayerPropertiesModal.jsx";

function SearchField({ placeholder }) {
  return (
    <div style={{ padding: "0 8px", width: "100%", flexShrink: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 4, height: 24, padding: 4,
        borderRadius: 2, background: "var(--surface-2)", border: "1px solid var(--border-primary)",
      }}>
        <Icon src={A.search} size={16} />
        <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-xs)" }}>{placeholder}</span>
      </div>
    </div>
  );
}

function SectionHeader({ label, onAdd }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 28, width: "100%",
      padding: "8px 8px 4px", flexShrink: 0,
    }}>
      <span style={{ flex: "1 0 0", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon src={A.layers} size={12} />
        <Icon src={A.add} size={12} style={onAdd ? { cursor: "pointer" } : undefined} onClick={onAdd} />
      </div>
    </div>
  );
}

// Simulations shown in the top block — each expands to reveal its IEFs.
const simulations = [
  { name: "Upton_003_1D.bat", active: true, iefs: ["UptonQ_100.IEF", "UptonQ_200.IEF", "UptonQ_300.IEF"] },
  { name: "Upton_002_1D.bat", active: false, iefs: ["UptonQ_100.IEF", "UptonQ_200.IEF"] },
  { name: "Upton_001_1D.bat", active: false, iefs: ["UptonQ_100.IEF"] },
];
// Components tree per the Figma "fm-v8.0-project-components-col-tree" example:
// lvl1 groups (FM 1D model / FM 2D model / Data library) with nested
// lvl2/lvl3 branches and lvl4 `file` leaves (which get the leading "+" icon).
const componentTree = [
  {
    icon: A.lhsList, label: "FM 1D model",
    children: [
      { icon: A.lhsChevronRight, label: "Upton_Q100" },
      { icon: A.lhsChevronRight, label: "Upton_Q200" },
      {
        icon: A.lhsChevronDown, label: "Upton_Q300",
        children: [
          {
            icon: A.lhsChevronDown, label: "Boundaries/Events",
            children: [
              { icon: A.lhsTxtFile, label: "Upton_Q100.IED", file: true },
              { icon: A.lhsTxtFile, label: "H+_Library.CSV", file: true },
            ],
          },
          { icon: A.lhsChevronRight, label: "Initial conditions" },
        ],
      },
    ],
  },
  {
    icon: A.lhsFm2d, label: "FM 2D model",
    children: [
      { icon: A.lhsChevronRight, label: "Input data" },
      { icon: A.lhsChevronRight, label: "Boundary data" },
      { icon: A.lhsChevronRight, label: "Active areas" },
      { icon: A.lhsChevronRight, label: "Initial conditions" },
      { icon: A.lhsChevronRight, label: "Event data" },
      {
        icon: A.lhsChevronDown, label: "2D model data",
        children: [
          {
            icon: A.lhsChevronDown, label: "2D-shapefile-group",
            children: [
              { icon: A.fm2dShapefileBoundLine, label: "2D_boundary_01", file: true },
              { icon: A.lhsPolyline, label: "Defence_01", file: true },
              { icon: A.lhsPolygon, label: "Polygon_01", file: true },
              { icon: A.lhsLink, label: "1D2D_LinkLines", file: true },
            ],
          },
        ],
      },
    ],
  },
  { icon: A.lhsDataLibrary, label: "Data library" },
];

// One row of the Components tree — padding-left increases per level (8/16/24/32),
// lvl1 gets the neutral-400 fill + Medium text, lvl4 gets the 28px height and a
// leading "+" expand icon before its file icon. Trailing is the fm-v8.0-more
// check badge (12px neutral-600 box with a check).
function ComponentTreeRow({ node, level, hasChildren, open, onToggle }) {
  const [hover, setHover] = useState(false);
  const padLeft = [8, 16, 24, 32][level - 1];
  const isFile = level === 4;
  // Branch chevrons rotate with the open state; lvl1 group icons (the FM 1D/2D
  // and Data library glyphs) stay put — they toggle too, just without a
  // direction cue of their own.
  const isChevron = node.icon === A.lhsChevronRight || node.icon === A.lhsChevronDown;
  const icon = hasChildren && isChevron
    ? (open ? A.lhsChevronDown : A.lhsChevronRight)
    : node.icon;
  return (
    <div
      onClick={hasChildren ? onToggle : undefined}
      onMouseEnter={() => hasChildren && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 4, width: "100%", borderRadius: 2,
        padding: `8px 8px 8px ${isFile ? 32 : padLeft}px`,
        height: isFile ? 28 : undefined,
        cursor: hasChildren ? "pointer" : "default",
        background: level === 1
          ? "var(--neutral-400)"
          : hover ? "var(--surface-3)" : "transparent",
      }}
    >
      {isFile && <Icon src={A.lhsPlus} size={12} />}
      <Icon src={icon} size={12} />
      <span style={{
        flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", fontWeight: level === 1 ? 500 : 400,
        color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{node.label}</span>
      <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--neutral-600)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon src={A.check} size={12} />
      </div>
    </div>
  );
}

const renderComponentTree = (nodes, level, collapsed, onToggle) =>
  nodes.map((n) => {
    const hasChildren = !!(n.children && n.children.length);
    const open = !collapsed[n.label];
    return (
      <Fragment key={n.label}>
        <ComponentTreeRow
          node={n}
          level={level}
          hasChildren={hasChildren}
          open={open}
          onToggle={() => onToggle(n.label)}
        />
        {hasChildren && open && renderComponentTree(n.children, level + 1, collapsed, onToggle)}
      </Fragment>
    );
  });

function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      title={on ? "Active" : "Inactive"}
      style={{
        width: 16, height: 12, position: "relative", flexShrink: 0,
        cursor: onClick ? "pointer" : "default",
      }}>
      {/* fm-v8.0-active-toggle track: 16×10 inset 1px, rx 5 */}
      <div style={{
        position: "absolute", top: 1, left: 0, width: 16, height: 10,
        borderRadius: 5, background: on ? "var(--surface-1)" : "var(--surface-1-invert)",
      }} />
      {/* knob: 8px, Off sits left (cx 5), On right (cx 11) */}
      <div style={{
        position: "absolute", top: 2, width: 8, height: 8, borderRadius: "50%",
        left: on ? 7 : 1, background: on ? "var(--surface-brand)" : "var(--text-invert)",
      }} />
    </div>
  );
}

// One row of the "fm-v8.0-row-item-lvl" design (Figma node 1790:59080) — the
// layer rows in the Layers tab, and the same shell the Components tree reuses.
// 28px tall, gap 4, radius 2. Leading is the expand/collapse "+"/"−" (reveals
// the legend row below), then the layer raster icon, the label, and the
// trailing fm-v8.0-more check badge (click toggles visibility). Variants
// mirror the design:
//   Default  transparent, Regular text, blue raster icon
//   Hover    neutral-500 fill, black text
//   Select   neutral-500 fill + 2px brand border, Medium black text
//   Hide     greyed raster icon, --text-tertiary label, empty badge
function LayerRow({ color, ramp, label, sublabel, active, hidden, expanded, onClick, onContextMenu, onToggleExpand, onToggleVisibility }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ flexShrink: 0 }}>
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 28,
          padding: "8px 6px", borderRadius: 2,
          border: `2px solid ${active ? "var(--surface-brand)" : "transparent"}`,
          background: active ? "var(--neutral-500)" : hover ? "var(--neutral-500)" : "transparent",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <div
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          title={expanded ? "Collapse" : "Expand"}
          style={{ width: 12, height: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Icon src={expanded ? A.lhsMinus : A.lhsPlus} size={12} />
        </div>
        <Icon src={hidden ? A.lhsRasterHide : A.lhsRaster} size={12} />
        <span style={{
          flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)",
          fontWeight: active ? 500 : 400,
          color: hidden
            ? "var(--text-tertiary)"
            : (active || hover) ? "var(--text-primary-selected)" : "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{label}</span>
        <div
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          title={hidden ? "Show layer" : "Hide layer"}
          role="button"
          style={{
            width: 12, height: 12, borderRadius: 2, flexShrink: 0, cursor: "pointer",
            background: "var(--neutral-600)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!hidden && <Icon src={A.check} size={12} />}
        </div>
      </div>
      {expanded && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 16, height: 28 }}>
          <div style={{
            width: 56, height: 12, borderRadius: 2, border: "1px solid var(--border-primary)", flexShrink: 0,
            background: ramp ? rampCss(ramp.stops) : `linear-gradient(90deg, ${color} 0%, ${color} 100%)`,
          }} />
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sublabel}
          </span>
        </div>
      )}
    </div>
  );
}

// A simulation row — the active one keeps the blue "active" header, the rest
// use the Figma "fm-v8.0-row-item-active" Property 1=default state (Regular
// 12px text, chevron LHS, toggle off) with the Property 1=hover state
// (bg #f3f3f3 = --surface-3, text #000). Clicking the row (or its chevron)
// expands/collapses the IEF list below it; the chevron rotates to point down
// when open, right when closed.
function SimRow({ name, active, iefs, on, expanded, onToggleExpand, onToggle }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
      <div
        onClick={() => onToggleExpand(name)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: active ? "8.5px 8px" : "10px 8px", borderRadius: 2, cursor: "pointer",
          background: active ? "var(--surface-brand)" : hover ? "var(--surface-3)" : "transparent",
        }}>
        <Icon src={A.simChevron} size={12}
          style={{
            ...(active ? { filter: "brightness(0) invert(1)" } : null),
            transform: expanded ? "rotate(90deg)" : "none",
          }} />
        <span style={{
          flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", fontWeight: active ? 500 : 400,
          color: active ? "var(--text-invert)" : hover ? "var(--text-primary-selected)" : "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{name}</span>
        {active && (
          <span style={{ fontSize: "var(--fs-xxs)", fontWeight: 500, color: "var(--text-invert)", border: "1px solid var(--text-invert)", borderRadius: 2, padding: 4, lineHeight: 1 }}>
            Active
          </span>
        )}
        <Toggle on={on} onClick={(e) => { e.stopPropagation(); onToggle(name); }} />
      </div>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 8px" }}>
          {iefs.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: 8, borderRadius: 2 }}>
              <Icon src={A.lhsList} size={12} />
              <span style={{
                flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)",
                color: active ? "var(--text-primary-selected)" : "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Everything below the panel header — the header itself (icon+dropdown
// switcher, title, filter/layers icons) is owned by the generic PanelSlot
// shell so any slot can swap between this and the other panel views.
// `layers`/`activeLayerId`/`onSetActiveLayer`/`onToggleLayerVisibility`/
// `onDeleteLayer`/`onAddLayer` — the real, user-growable vector layer list
// (see App.jsx); `polygons` supplies each layer's live feature count.
// `polygonLayerVisible`/`setPolygonLayerVisible` were the old single-layer
// toggle — superseded by per-layer visibility on `layers` now that any
// number of layers can exist side by side.
export function ProjectPanelBody({ layers, activeLayerId, onSetActiveLayer, onToggleLayerVisibility, onDeleteLayer, onAddLayer, onZoomToLayer, onOpenLayerProperties, polygons, tab: tabProp, setTab: setTabProp }) {
  const [tabState, setTabState] = useState("components");
  // Height of the Simulation block above the Components section — the grabber
  // between them drags to resize it, exactly like NetworkPanel's divider above
  // "Network initial conditions".
  const [simH, setSimH] = useState(190);
  // Per-simulation mini-toggle state ("on" model is the active sim).
  const [simToggles, setSimToggles] = useState({ "Upton_003_1D.bat": true });
  // Which simulations are expanded to show their IEFs (active starts open).
  const [expandedSims, setExpandedSims] = useState({ "Upton_003_1D.bat": true });
  const toggleSimExpand = (name) =>
    setExpandedSims((e) => ({ ...e, [name]: !e[name] }));
  // Components tree expand/collapse — keyed by label, entries are the nodes
  // currently collapsed (everything starts expanded, matching the Figma tree).
  const [collapsedTree, setCollapsedTree] = useState({});
  const toggleTreeNode = (label) =>
    setCollapsedTree((c) => ({ ...c, [label]: !c[label] }));
  // Which layers are expanded to show their colour-ramp legend row.
  const [expandedLayers, setExpandedLayers] = useState({});
  const toggleLayerExpand = (id) =>
    setExpandedLayers((e) => ({ ...e, [id]: !e[id] }));
  const toggleSim = (name) =>
    setSimToggles((t) => ({ ...t, [name]: !t[name] }));
  // Controllable from outside (App.jsx switches this to "layers" right
  // after a new layer is created, so it's immediately visible) but still
  // works standalone with its own state if no controlling props are given.
  const tab = tabProp ?? tabState;
  const setTab = setTabProp ?? setTabState;
  const rootRef = useRef(null);
  const [layerMenu, setLayerMenu] = useState(null); // { x, y, layer }

  const openLayerMenu = (e, layer) => {
    e.preventDefault();
    // Viewport coords — ContextMenu portals to <body> with fixed positioning
    // so the panel's own overflow can't crop the menu.
    setLayerMenu({ x: e.clientX, y: e.clientY, layer });
  };

  const onSimDividerDown = (e) => {
    e.preventDefault();
    const startY = e.clientY, startH = simH;
    const onMove = (ev) => setSimH(Math.max(150, Math.min(420, startH + (ev.clientY - startY))));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Downloads the layer's features as a GeoJSON FeatureCollection — the one
  // geodata format the browser can write with zero extra dependencies. True
  // shapefile (.shp/.shx/.dbf) is a binary multi-file format that would need
  // a dedicated writer library; GeoJSON is the practical stand-in until/
  // unless that's added. Any GIS tool (QGIS, ArcGIS, mapshaper.org) can
  // re-save this straight to .shp if a real shapefile is needed.
  const exportLayer = (layer) => {
    const feats = (polygons || []).filter((p) => (p.layerId || "demo-shapefile") === layer.id);
    const geojson = {
      type: "FeatureCollection",
      features: feats.map((p) => ({
        type: "Feature",
        properties: { id: p.id, layer: layer.name },
        geometry: {
          type: "Polygon",
          coordinates: [
            p.points.map((pt) => [pt.x, pt.y]),
            ...(p.holes || []).map((h) => h.map((pt) => [pt.x, pt.y])),
          ],
        },
      })),
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layer.name || "layer"}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // "Zoom to layer" fits the canvas to the layer's feature bounds (see
  // App.jsx's zoomToLayer → GisCanvas zoomExtent). "Show attributes"/
  // "Properties" still mirror OSWindow's General/Project/etc. menus as
  // visual-only chrome, since they need an attribute inspector that isn't
  // wired up from this panel yet.
  const layerMenuItems = layerMenu ? [
    { label: "Start edit", onClick: () => onSetActiveLayer(layerMenu.layer.id) },
    { label: "Remove layer", onClick: () => onDeleteLayer(layerMenu.layer.id), danger: true },
    { label: "Zoom to layer", onClick: () => onZoomToLayer?.(layerMenu.layer.id) },
    { label: "Export", onClick: () => exportLayer(layerMenu.layer) },
    { label: "Show attributes", onClick: () => {} },
    { label: "Properties", onClick: () => onOpenLayerProperties?.(layerMenu.layer) },
  ] : [];

  return (
    <div ref={rootRef} style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden", position: "relative" }}>
      <SearchField placeholder={tab === "layers" ? "Search layers" : "Search project"} />

      {tab === "components" ? (
        <>
      <SectionHeader label="Simulation" />

      {/* Simulations list — one scrollable window over all of them (003, 002,
          001); height is resizable via the grabber below, and the whole list
          scrolls up/down when it outgrows that height. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, height: simH, overflowY: "auto", padding: "0 8px" }}>
          {simulations.map(s => (
            <SimRow
              key={s.name}
              name={s.name}
              active={s.active}
              iefs={s.iefs}
              on={!!simToggles[s.name]}
              expanded={!!expandedSims[s.name]}
              onToggleExpand={toggleSimExpand}
              onToggle={toggleSim}
            />
          ))}
      </div>

      {/* Drag to resize the Simulation block above (same grabber as the right
          panel's "Network initial conditions" divider) */}
      <div onMouseDown={onSimDividerDown} title="Drag to resize"
        style={{ height: 6, flexShrink: 0, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", borderTop: "1px solid var(--border-primary)", borderBottom: "1px solid var(--border-primary)" }}>
        <div style={{ width: 28, height: 2, borderRadius: 1, background: "var(--border-secondary)" }} />
      </div>
      <SectionHeader label="Components" onAdd={onAddLayer} />

      {/* Components tree */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flex: "1 0 0", overflow: "auto" }}>
        {renderComponentTree(componentTree, 1, collapsedTree, toggleTreeNode)}
      </div>
        </>
      ) : (
        <>
      <SectionHeader label="Layers" onAdd={onAddLayer} />

      {/* Layers list — every entry (seeded or user-added via "Add GIS
          data") uses the fm-v8.0-row-item-lvl LayerRow: click to make it the
          active drawing target (so the Pen tool in Live Edit adds new
          polygons to it), the leading "+"/"−" expands a colour-ramp legend,
          and the trailing check badge toggles visibility on the canvas.
          Right-click for the Figma "fm-v8.0-row-item" context menu (Start
          edit/Remove layer/Zoom to layer/Export/Show attributes/Properties)
          — see `openLayerMenu`. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flex: "1 0 0", overflow: "auto" }}>
        {(layers || []).map((l) => {
          const count = (polygons || []).filter((p) => (p.layerId || "demo-shapefile") === l.id).length;
          const active = l.id === activeLayerId;
          return (
            <LayerRow
              key={l.id}
              color={l.color}
              ramp={l.ramp}
              label={l.name}
              sublabel={`${count} feature${count === 1 ? "" : "s"}${active ? " · active for drawing" : ""}`}
              active={active}
              hidden={l.visible === false}
              expanded={!!expandedLayers[l.id]}
              onClick={() => onSetActiveLayer(l.id)}
              onContextMenu={(e) => openLayerMenu(e, l)}
              onToggleExpand={() => toggleLayerExpand(l.id)}
              onToggleVisibility={() => onToggleLayerVisibility(l.id)}
            />
          );
        })}
        {(!layers || layers.length === 0) && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
            No layers yet — use the + above, or Home ▸ Add GIS data, to create one.
          </span>
        )}
      </div>
        </>
      )}

      {/* Footer tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", flex: "1 0 0" }}>
          <div
            onClick={() => setTab("components")}
            style={{
              flex: "1 0 0", height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              background: tab === "components" ? "var(--surface-4)" : "var(--surface-1)",
              border: `1px solid ${tab === "components" ? "var(--border-secondary)" : "var(--border-primary)"}`,
              borderRadius: "2px 0 0 2px", fontSize: "var(--fs-xs)", fontWeight: 500,
              color: tab === "components" ? "var(--text-primary-selected)" : "var(--text-secondary)",
            }}>Components</div>
          <div
            onClick={() => setTab("layers")}
            style={{
              flex: "1 0 0", height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              background: tab === "layers" ? "var(--surface-4)" : "var(--surface-1)",
              border: `1px solid ${tab === "layers" ? "var(--border-secondary)" : "var(--border-primary)"}`,
              borderRadius: "0 2px 2px 0", fontSize: "var(--fs-xs)", fontWeight: 500,
              color: tab === "layers" ? "var(--text-primary-selected)" : "var(--text-secondary)",
            }}>Layers</div>
        </div>
        <div style={{
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2,
        }}>
          <Icon src={A.settingsColor} size={16} />
        </div>
      </div>

      {layerMenu && (
        <ContextMenu x={layerMenu.x} y={layerMenu.y} items={layerMenuItems} onClose={() => setLayerMenu(null)} />
      )}
    </div>
  );
}

