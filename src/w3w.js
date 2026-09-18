// Simulated what3words for the demo — we have no what3words API access (it
// needs a key), so the map footer derives a stable ///word.word.word from
// the world position using ~3m grid cells, the same granularity the real
// service uses. This module keeps that simulation in one place AND lets the
// global search reverse it: type a ///word.word.word you saw in the footer
// and it resolves back to the ~3m cell it came from, so the map can jump
// there. Real what3words addresses resolve fine too *if* they happen to
// exist inside the simulated demo grid.

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
const W3W_WORD_SET = new Set(W3W_WORDS);

// Grid cell size in world units — ~8.8m at the demo's georeferencing scale,
// i.e. the same "every point has a words address" granularity class as the
// real 3m what3words grid.
const W3W_CELL = 3;

function hash2(a, b) {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return Math.abs(h ^ (h >>> 16));
}

// Words for one ~3m grid cell (world (0,0) anchored near Upton-upon-Severn).
function w3wCell(cx, cy) {
  return [
    W3W_WORDS[hash2(cx, cy) % W3W_WORDS.length],
    W3W_WORDS[hash2(cy, cx + 1) % W3W_WORDS.length],
    W3W_WORDS[hash2(cx + 1, cy + 1) % W3W_WORDS.length],
  ];
}

// Stable ///word.word.word for a world position (what the map footer shows).
export function simulatedW3W(wx, wy) {
  const [w1, w2, w3] = w3wCell(Math.floor(wx / W3W_CELL), Math.floor(wy / W3W_CELL));
  return `///${w1}.${w2}.${w3}`;
}

// The demo world's simulated grid lives around the seeded network + the
// user-panning reach of its OSM backdrop, so the reverse lookup only scans
// that window. Cheap: a few million hashed cells resolves in a few ms.
const SCAN_X_MIN = -2000, SCAN_X_MAX = 1500;
const SCAN_Y_MIN = -2500, SCAN_Y_MAX = 2000;

// Resolve a three-word address (already split into words) back into the
// world-space centre of the matching ~3m cell, or null when the words aren't
// inside the simulated demo grid (e.g. a genuine real-world what3words that
// isn't in the simulated world).
export function resolveW3WWords(w1, w2, w3) {
  if (!W3W_WORD_SET.has(w1) || !W3W_WORD_SET.has(w2) || !W3W_WORD_SET.has(w3)) return null;
  const cx0 = Math.floor(SCAN_X_MIN / W3W_CELL),
    cx1 = Math.floor(SCAN_X_MAX / W3W_CELL);
  const cy0 = Math.floor(SCAN_Y_MIN / W3W_CELL),
    cy1 = Math.floor(SCAN_Y_MAX / W3W_CELL);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const [a, b, c] = w3wCell(cx, cy);
      if (a === w1 && b === w2 && c === w3) {
        return { x: cx * W3W_CELL + W3W_CELL / 2, y: cy * W3W_CELL + W3W_CELL / 2 };
      }
    }
  }
  return null;
}

// Does a search query look like a what3words address? (///word.word.word,
// ++/++word.word.word / word.word.word.) Yields { words } with found:false
// when it's a valid-looking address that isn't in the simulated grid, and
// { words, x, y } when it resolves. Returns null for non-w3w queries so the
// caller can fall through to the normal geocoder unchanged.
export function matchW3WQuery(query) {
  const q = query.trim().toLowerCase();
  const words = q.replace(/^\/+/, "").split(".").map((w) => w.trim());
  if (words.length !== 3 || words.some((w) => !/^[a-z]+$/.test(w))) return null;
  const pos = resolveW3WWords(words[0], words[1], words[2]);
  return pos ? { words, x: pos.x, y: pos.y } : { words, found: false };
}