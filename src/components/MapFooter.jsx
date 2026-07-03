import { A, Icon } from "../assets.jsx";
import { METERS_PER_WORLD_UNIT } from "./OsmBasemap.jsx";

// "Nice" round scale-bar values, in metres.
const NICE_METERS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];
const TARGET_PX = 80;

function pickScale(metersPerPx) {
  const targetM = metersPerPx * TARGET_PX;
  let best = NICE_METERS[0];
  for (const m of NICE_METERS) {
    if (m <= targetM) best = m;
    else break;
  }
  return best;
}

function fmt(value, unit) {
  return `${value.toFixed(value < 10 ? 1 : 0)}${unit}`;
}

// Simulated what3words — we have no API access, so this derives a stable
// (not random-per-render) ///word.word.word from the world position using
// ~3m grid cells, the same granularity the real service uses.
const W3W_WORDS = [
  "apple", "river", "stone", "cloud", "tiger", "willow", "bridge", "meadow",
  "copper", "forest", "harbor", "island", "jungle", "kettle", "lantern", "marble",
  "nectar", "orchid", "pencil", "quartz", "ribbon", "silver", "temple", "umbrella",
  "velvet", "walnut", "canyon", "desert", "ember", "fossil", "granite", "hollow",
  "ivory", "jasper", "kernel", "lagoon", "mantle", "needle", "opal", "pebble",
  "quiver", "raven", "summit", "thicket", "unity", "valley", "willow2", "yonder",
  "zephyr", "amber", "birch", "cedar", "delta", "ember2", "flint", "glacier",
  "heron", "indigo", "juniper", "knoll", "lupine", "moss", "nutmeg", "olive",
];
function hash2(a, b) {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return Math.abs(h ^ (h >>> 16));
}
function simulatedW3W(wx, wy) {
  const cx = Math.floor(wx / 3), cy = Math.floor(wy / 3);
  const w1 = W3W_WORDS[hash2(cx, cy) % W3W_WORDS.length];
  const w2 = W3W_WORDS[hash2(cy, cx + 1) % W3W_WORDS.length];
  const w3 = W3W_WORDS[hash2(cx + 1, cy + 1) % W3W_WORDS.length];
  return `///${w1}.${w2}.${w3}`;
}

function GuideItem({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
      <Icon src={icon} size={12} />
      <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

// GIS view status bar — scale bar + live cursor coordinates + a contextual
// mouse-control hint + basemap attribution. `guideMode` switches the middle
// hint set to match whichever nav tool is actively being drag-scrubbed.
export default function MapFooter({ cursorWorld, scale, guideMode = "default", showAttribution }) {
  const metersPerPx = METERS_PER_WORLD_UNIT / scale;
  const meters = pickScale(metersPerPx);
  const barPx = meters / metersPerPx;
  const km = meters / 1000, mi = meters * 0.000621371;

  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column" }}>
      {/* Scale bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 8px 4px" }}>
        <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-primary)" }}>{fmt(km, "km")}</span>
        <div style={{ width: barPx, height: 1, background: "var(--text-primary)" }} />
        <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-primary)" }}>{fmt(mi, "mi")}</span>
      </div>

      {/* Status bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 11, height: 24, padding: "4px 8px",
        background: "var(--surface-1)", borderTop: "1px solid var(--border-primary)",
        borderRadius: "0 0 4px 4px",
      }}>
        <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", alignItems: "center", gap: 11, fontSize: "var(--fs-xxs)", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span>X:{cursorWorld ? cursorWorld.x.toFixed(2) : "—"}</span>
          <span>Y:{cursorWorld ? cursorWorld.y.toFixed(2) : "—"}</span>
          <span title="Simulated — no what3words API configured" style={{ color: "var(--surface-brand)" }}>
            {cursorWorld ? simulatedW3W(cursorWorld.x, cursorWorld.y) : "///—.—.—"}
          </span>
        </div>
        <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 11 }}>
          {guideMode === "zoomDrag" ? (
            <>
              <GuideItem icon={A.mouseLeftDrag} label="Hold and drag up to zoom in" />
              <GuideItem icon={A.mouseLeftDrag2} label="Hold and drag down to zoom out" />
            </>
          ) : (
            <>
              <GuideItem icon={A.mouseLeft} label="Select" />
              <GuideItem icon={A.mouseScroll} label="Zoom" />
              <GuideItem icon={A.mouseRight} label="Options" />
            </>
          )}
        </div>
        <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          {showAttribution && (
            <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
              © OpenStreetMap contributors
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
