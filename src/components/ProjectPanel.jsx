import { A, Icon } from "../assets.jsx";

function PanelHeader({ icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "4px 8px 4px 4px", flexShrink: 0,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 24,
        padding: 4, borderRadius: 2, background: "var(--surface-1)", border: "1px solid var(--border-primary)",
      }}>
        <Icon src={icon} size={16} />
        <Icon src={A.keyDown} size={12} />
      </div>
      <span style={{ fontSize: "var(--fs-s)", fontWeight: 500 }}>{title}</span>
      <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <Icon src={A.labelFilter} size={12} />
        <Icon src={A.layers} size={12} />
      </div>
    </div>
  );
}

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

function SectionHeader({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 28, width: "100%",
      padding: "8px 8px 4px", flexShrink: 0,
    }}>
      <span style={{ flex: "1 0 0", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon src={A.layers} size={12} />
        <Icon src={A.add} size={12} />
      </div>
    </div>
  );
}

const iefs = ["UptonQ_100.IEF", "UptonQ_200.IEF", "UptonQ_300.IEF"];
const components = [
  { icon: A.lhs0, label: "FM 1D model" },
  { icon: A.lhs1, label: "Data library" },
  { icon: A.lhs2, label: "Hydrology+" },
  { icon: A.lhs3, label: "Supporting data" },
];

function Toggle({ on }) {
  return (
    <div style={{
      width: 16, height: 10, borderRadius: 6, flexShrink: 0,
      background: on ? "#fff" : "var(--neutral-1000)",
      border: on ? "none" : "1px solid var(--neutral-900)",
      position: "relative", cursor: "pointer",
    }}>
      <div style={{
        position: "absolute", top: 1, width: 8, height: 8, borderRadius: "50%",
        left: on ? 7 : 1, background: on ? "var(--surface-brand)" : "#fff",
      }} />
    </div>
  );
}

export default function ProjectPanel({ width = 232 }) {
  return (
    <div style={{
      width, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", gap: 4,
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4, overflow: "hidden",
    }}>
      <PanelHeader icon={A.hierarchyLine} title="Project" />
      <SearchField placeholder="Search project" />
      <SectionHeader label="Simulation" />

      {/* Simulations list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flexShrink: 0 }}>
        {/* Active simulation with expanded IEFs */}
        <div style={{ borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8.5px 8px",
            background: "var(--surface-brand)", borderRadius: 2,
          }}>
            <Icon src={A.keyDown} size={12} style={{ filter: "brightness(0) invert(1)" }} />
            <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-invert)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Upton_003_1D.bat
            </span>
            <span style={{ fontSize: "var(--fs-xxs)", fontWeight: 500, color: "var(--text-invert)", border: "1px solid var(--text-invert)", borderRadius: 2, padding: 4, lineHeight: 1 }}>
              Active
            </span>
            <Toggle on />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 8px" }}>
            {iefs.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: 8, borderRadius: 2 }}>
                <Icon src={A.lhs1} size={12} />
                <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", color: "var(--text-primary-selected)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Collapsed simulations */}
        {["Upton_002_1D.bat", "Upton_001_1D.bat"].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 8px", borderRadius: 2 }}>
            <Icon src={A.keyDown} size={12} style={{ transform: "rotate(-90deg)" }} />
            <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
            <Toggle on={false} />
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border-primary)", margin: "8px 16px", flexShrink: 0 }} />
      <SectionHeader label="Components" />

      {/* Components tree */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flex: "1 0 0", overflow: "auto" }}>
        {components.map(c => (
          <div key={c.label} style={{
            display: "flex", alignItems: "center", gap: 4, padding: 8, borderRadius: 2, background: "var(--neutral-400)",
          }}>
            <Icon src={c.icon} size={12} />
            <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--neutral-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon src={A.check} size={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", flex: "1 0 0" }}>
          <div style={{
            flex: "1 0 0", height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-4)", border: "1px solid var(--border-secondary)",
            borderRadius: "2px 0 0 2px", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-primary-selected)",
          }}>Components</div>
          <div style={{
            flex: "1 0 0", height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-1)", border: "1px solid var(--border-primary)",
            borderRadius: "0 2px 2px 0", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer",
          }}>Layers</div>
        </div>
        <div style={{
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2,
        }}>
          <Icon src={A.settingsColor} size={16} />
        </div>
      </div>
    </div>
  );
}
