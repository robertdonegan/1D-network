// Demo-only per-edge flow data (no real hydraulic model behind this
// prototype) — deterministic from the edge id so it's stable across
// re-renders/pans instead of jittering every frame.
// A plain sum-of-chars hash puts all its variation in the low bits, so
// short similar ids ("e0".."e6") collide once shifted — mix with a
// multiply + xor-shift (Mulberry32-style) so every bit of the output
// depends on the whole input, not just its last character.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = h ^ (h >>> 16);
  return h >>> 0;
}

const G = 9.81; // m/s² — real physics, just fed with demo numbers

export function mockFlowForEdge(edgeId) {
  const hVel = hash(edgeId + ":velocity");
  const hRate = hash(edgeId + ":rate");
  const hDir = hash(edgeId + ":direction");
  const hDepth = hash(edgeId + ":depth");
  const hInvert = hash(edgeId + ":invert");
  const velocity = ((hVel % 100) / 100) * 0.98 + 0.01; // m/s, 0.01–0.99 — matches the Figma legend range
  const rateLps = Math.round((((hRate % 5000) / 10 + 1) * 10)) / 10; // ~1–500 l/s
  const direction = hDir % 5 === 0 ? "Upstream" : "Downstream";
  const depthM = Math.round((((hDepth % 220) / 100) + 0.15) * 100) / 100; // 0.15–2.35 m
  const invertLevelM = Math.round((((hInvert % 4000) / 100) + 5) * 100) / 100; // 5–45 m AOD, demo catchment
  const waterLevelM = Math.round((invertLevelM + depthM) * 100) / 100;
  // Real Froude number from the (demo) velocity + depth — Fr<1 subcritical,
  // Fr>1 supercritical, the single most load-bearing number for a hydraulic
  // modeller deciding whether a reach's flow regime makes physical sense.
  const froude = Math.round((velocity / Math.sqrt(G * depthM)) * 100) / 100;
  const regime = froude < 0.95 ? "Subcritical" : froude > 1.05 ? "Supercritical" : "Critical";
  const rateM3s = Math.round((rateLps / 1000) * 1000) / 1000;
  return { velocity, rateLps, rateM3s, direction, depthM, invertLevelM, waterLevelM, froude, regime };
}

// Flow-label metric options (Line labels dropdown) — every field a
// hydraulic modeller would plausibly want stamped along a reach, not just
// the flow rate. `format` renders the value with its unit.
export const FLOW_LABEL_METRICS = [
  { id: "rateLps", label: "l/s (Litres per second)", format: (f) => `${f.rateLps.toFixed(1)}` },
  { id: "rateM3s", label: "m³/s (Cumecs)", format: (f) => `${f.rateM3s.toFixed(3)}` },
  { id: "velocity", label: "Velocity (m/s)", format: (f) => `${f.velocity.toFixed(2)}` },
  { id: "waterLevelM", label: "Water level (m AOD)", format: (f) => `${f.waterLevelM.toFixed(2)}` },
  { id: "depthM", label: "Depth (m)", format: (f) => `${f.depthM.toFixed(2)}` },
  { id: "froude", label: "Froude number", format: (f) => `${f.froude.toFixed(2)}` },
];
