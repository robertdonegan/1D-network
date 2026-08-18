import { A, Icon } from "../assets.jsx";

const SIDEBAR_SECTIONS = [
  { label: "Favourites", items: ["Work", "Projects"] },
  { label: "This PC", items: ["Desktop", "Documents", "Downloads", "Photos", "Videos", "Music"] },
  { label: "Cloud Drives", items: [] },
];

// Generic Windows-style file picker mockup — matches Figma's "Windows File
// Explorer" reference component. Reused by every ribbon button whose action
// is semantically a file load/open, since this demo has no real filesystem
// to browse; picking a file or hitting Open/Cancel both just close it.
export default function FileExplorerModal({ title, fileTypeLabel, files = ["Project", "Project.zip", "Superceded"], onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.3)", zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 716, background: "var(--surface-1)", borderRadius: 4, overflow: "hidden",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1), 0 0 20px rgba(28,63,253,0.05)",
          display: "flex", flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window title bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 30, padding: "0 8px", background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon src={A.filesFolder} size={14} />
            <span style={{ fontSize: 10, color: "var(--text-primary-selected)" }}>{title}</span>
          </div>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, border: "none", background: "transparent", cursor: "pointer" }}
          >
            <Icon src={A.cancel} size={10} />
          </button>
        </div>
        {/* Breadcrumb / search bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, background: "var(--surface-3)" }}>
          <Icon src={A.arrowLeft} size={14} style={{ opacity: 0.4 }} />
          <Icon src={A.arrowRight} size={14} style={{ opacity: 0.4 }} />
          <div style={{ flex: "1 0 0", height: 20, display: "flex", alignItems: "center", padding: "0 6px", borderRadius: 2, background: "var(--surface-4)", fontSize: 10, color: "var(--text-secondary)" }}>
            This PC &gt; Documents
          </div>
          <div style={{ width: 140, height: 20, display: "flex", alignItems: "center", padding: "0 6px", borderRadius: 2, background: "var(--surface-4)", fontSize: 10, color: "var(--text-secondary)" }}>
            Search Desktop
          </div>
        </div>
        {/* Sidebar + file grid */}
        <div style={{ display: "flex", height: 260 }}>
          <div style={{ width: 150, flexShrink: 0, padding: 5, background: "var(--surface-2)", overflow: "auto", borderRight: "1px solid var(--border-primary)" }}>
            {SIDEBAR_SECTIONS.map((sec) => (
              <div key={sec.label} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary-selected)", padding: "3px 4px" }}>{sec.label}</div>
                {sec.items.map((it) => (
                  <div key={it} style={{ fontSize: 10, color: "var(--text-primary-selected)", padding: "3px 4px 3px 20px" }}>{it}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ flex: "1 0 0", padding: 8, display: "flex", gap: 10, alignItems: "flex-start", overflow: "auto" }}>
            {files.map((f) => (
              <div key={f} style={{ width: 79, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", padding: 4, borderRadius: 3 }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Icon src={A.filesFolder} size={48} />
                <span style={{ fontSize: 10, color: "var(--text-primary-selected)", textAlign: "center" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        {/* File name + type row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 12px 12px 128px", background: "var(--surface-3)" }}>
          <span style={{ fontSize: 10, color: "var(--text-secondary)", flexShrink: 0 }}>File name:</span>
          <div style={{ flex: "1 0 0", height: 20, borderRadius: 2, background: "var(--surface-4)" }} />
          <div style={{ width: 185, height: 20, display: "flex", alignItems: "center", padding: "0 6px", borderRadius: 2, background: "var(--surface-4)", fontSize: 10, color: "var(--text-secondary)" }}>
            {fileTypeLabel}
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "4px 12px 12px 128px", background: "var(--surface-3)" }}>
          <button
            onClick={onClose}
            style={{ height: 32, padding: "0 24px", background: "var(--surface-1)", border: "1px solid var(--border-focus, #000)", borderRadius: 2, cursor: "pointer", fontSize: "var(--fs-s)", color: "var(--text-secondary)" }}
          >
            Open
          </button>
          <button
            onClick={onClose}
            style={{ height: 32, padding: "0 24px", background: "var(--surface-1)", border: "1px solid var(--border-secondary)", borderRadius: 2, cursor: "pointer", fontSize: "var(--fs-s)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
