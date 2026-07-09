import { useState } from "react";
import { A, Icon } from "../assets.jsx";

// Figma "FMv8.0 Right Hand Panels" Toolbox spec (fm-v8.0-toolbox-content,
// node 4003:75909) — only "Global edit > 1D River Networks" has its real
// tool list; the other categories are stubbed with a couple of dummy
// entries each so the accordion interaction (expand/collapse, search
// filter) is exercised everywhere, matching the reference screenshot's
// full section list without pretending every category is fully built.
const TOOLBOX_TREE = [
  { id: "recent", label: "Recently used", items: [] },
  {
    id: "globaledit", label: "Global edit", open: true,
    groups: [
      {
        id: "1driver", label: "1D River Networks", open: true,
        items: [
          { label: "CES Section" },
          { label: "FEH Boundary" },
          { label: "Flow Boundary Time Multiplier", disabled: true },
          { label: "FSR16 Boundary" },
          { label: "Spill Modular Limit" },
          { label: "Muskingum VPMC Boundary" },
          { label: "ReFH Boundary" },
          { label: "Reservoir Runoff Factor" },
          { label: "Roughness" },
          { label: "Spill Crest" },
          { label: "Spill Weir Coefficient" },
        ],
      },
      { id: "1durban", label: "1D Urban Networks", items: [{ label: "Ground XXXXXX" }] },
    ],
  },
  { id: "addbuild", label: "Additional model build tools", items: [{ label: "Blockage optimiser" }, { label: "Batch unit editor" }] },
  { id: "review", label: "Model review tools", items: [{ label: "Network validator" }, { label: "Long section checker" }] },
  { id: "results", label: "Model results", items: [{ label: "Peak flow summary" }] },
  { id: "floodmapping", label: "Flood mapping", items: [{ label: "Depth grid merge" }] },
  { id: "grid", label: "Grid tools", items: [{ label: "Grid resample" }] },
  { id: "shapefile", label: "Shapefile tools", items: [{ label: "Shapefile import" }] },
  { id: "forecasting", label: "Forecasting", items: [{ label: "Ensemble runner" }] },
  { id: "postprocess", label: "Post-processing tools", items: [{ label: "Batch export" }] },
  { id: "deprecated", label: "Deprecated tools", items: [{ label: "Legacy roughness editor", disabled: true }] },
];

function matches(label, q) {
  return !q || label.toLowerCase().includes(q);
}

function ToolRow({ item, active, onClick }) {
  return (
    <div
      onClick={item.disabled ? undefined : onClick}
      title={item.disabled ? "Not available in this demo" : "Click to select"}
      style={{
        display: "flex", alignItems: "center", gap: 8, height: 28, padding: "0 8px 0 24px",
        borderRadius: 2, cursor: item.disabled ? "default" : "pointer",
        background: active ? "var(--surface-3)" : "transparent",
      }}
      onMouseOver={(e) => { if (!item.disabled && !active) e.currentTarget.style.background = "var(--surface-2)"; }}
      onMouseOut={(e) => { if (!item.disabled) e.currentTarget.style.background = active ? "var(--surface-3)" : "transparent"; }}
    >
      <Icon src={item.disabled ? A.toolboxToolDisabled : A.toolboxTool} size={12} />
      <span style={{
        fontSize: "var(--fs-xs)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        color: item.disabled ? "var(--text-tertiary)" : "var(--text-primary)",
      }}>
        {item.label}
      </span>
    </div>
  );
}

function ToolGroup({ group, query, active, setActive, forceOpen }) {
  const [open, setOpen] = useState(!!group.open);
  const isOpen = forceOpen || open;
  const items = group.items.filter((it) => matches(it.label, query));
  if (query && items.length === 0) return null;
  return (
    <div>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 8px 0 16px",
          cursor: "pointer", borderRadius: 2,
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Icon src={isOpen ? A.toolboxChevronExpanded : A.toolboxChevronCollapsed} size={12} />
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>{group.label}</span>
      </div>
      {isOpen && items.map((it) => (
        <ToolRow key={it.label} item={it} active={active === it.label} onClick={() => setActive(it.label)} />
      ))}
    </div>
  );
}

// Top-level accordion section (Recently used / Global edit / Additional
// model build tools / ...) — either a flat `items` list or nested `groups`
// (only Global edit has sub-groups, matching the Figma tree).
function ToolSection({ section, query, active, setActive }) {
  const [open, setOpen] = useState(!!section.open || !!query);
  const isOpen = query ? true : open;
  const flatItems = (section.items || []).filter((it) => matches(it.label, query));
  const groups = section.groups || [];
  const groupsHaveMatches = groups.some((g) => !query || g.items.some((it) => matches(it.label, query)));
  const isEmpty = !flatItems.length && !groups.length;
  if (query && flatItems.length === 0 && !groupsHaveMatches) return null;

  return (
    <button
      onClick={() => setOpen((v) => !v)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "stretch", width: "100%",
        border: "none", background: "transparent", padding: 0, textAlign: "left", font: "inherit", cursor: "pointer",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 4, height: 32, padding: "0 8px",
        background: "var(--surface-3)", borderRadius: 2,
      }}>
        <Icon src={isOpen ? A.toolboxChevronExpanded : A.toolboxChevronCollapsed} size={12} />
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-primary)" }}>{section.label}</span>
      </div>
      {isOpen && (
        <div style={{ padding: "2px 0" }}>
          {isEmpty && (
            <div style={{ padding: "6px 16px", fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>
              No tools here yet
            </div>
          )}
          {flatItems.map((it) => (
            <ToolRow key={it.label} item={it} active={active === it.label} onClick={() => setActive(it.label)} />
          ))}
          {groups.map((g) => (
            <ToolGroup key={g.id} group={g} query={query} active={active} setActive={setActive} forceOpen={!!query} />
          ))}
        </div>
      )}
    </button>
  );
}

// Docked Toolbox panel body (PanelSlot's "toolbox" view) — also reused
// as-is inside App.jsx's floating/undocked Toolbox window, so both modes
// stay in sync automatically (same component, same local search/active state
// per mount).
export function ToolboxPanelBody() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null);
  const query = q.trim().toLowerCase();

  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 8, padding: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, height: 24, padding: "0 8px", flexShrink: 0,
        background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2,
      }}>
        <Icon src={A.search} size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search toolbox"
          style={{
            flex: "1 0 0", minWidth: 0, border: "none", outline: "none", background: "transparent",
            font: "inherit", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
          }}
        />
      </div>
      <div style={{ flex: "1 0 0", minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {TOOLBOX_TREE.map((section) => (
          <ToolSection key={section.id} section={section} query={query} active={active} setActive={setActive} />
        ))}
      </div>
    </div>
  );
}
