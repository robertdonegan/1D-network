import { useMemo } from "react";

// Demo-only backdrop: real OpenStreetMap raster tiles positioned under the
// network using the same pan/zoom/rotate transform as everything else, so
// it visually tracks the canvas. World (0,0) is anchored near
// Upton-upon-Severn (the sample project's namesake), and the demo network's
// seed coordinates (App.jsx's INIT_NODES) are real lon/lat converted via
// `lonLatToWorld` — so unlike a typical placeholder backdrop, this one
// actually stays georeferenced under the network as the view rotates.
const TILE_SIZE = 256;
const BASE_ZOOM = 15;
const ANCHOR_LON = -2.2, ANCHOR_LAT = 52.058;

// Implied ground resolution at the anchor (Web Mercator), so the GIS
// footer's scale bar can agree with the OSM backdrop's apparent scale even
// when the backdrop itself is toggled off.
export const METERS_PER_WORLD_UNIT = (156543.03392 * Math.cos((ANCHOR_LAT * Math.PI) / 180)) / 2 ** BASE_ZOOM;

function lonLatToTilePx(lon, lat, zoom) {
  const n = 2 ** zoom;
  const x = ((lon + 180) / 360) * n * TILE_SIZE;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE;
  return { x, y };
}
const anchorPx = lonLatToTilePx(ANCHOR_LON, ANCHOR_LAT, BASE_ZOOM);

// Same demo-only anchor used to convert a real-world lon/lat (e.g. a
// geocoding search result) into this app's world-coordinate space, so the
// top-bar location search can pan the canvas there.
export function lonLatToWorld(lon, lat) {
  const p = lonLatToTilePx(lon, lat, BASE_ZOOM);
  return { x: p.x - anchorPx.x, y: p.y - anchorPx.y };
}

export default function OsmBasemap({ view, width, height }) {
  const rotation = view.rotation || 0;
  const tiles = useMemo(() => {
    const w = width || 800, h = height || 600;
    // Visible world-space corners — inverse-transform all four screen
    // corners (not just two) so the needed-tile bounding box is correct
    // even when the view is rotated, not just panned/zoomed.
    const rad = (-rotation * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const toWorld = (sx, sy) => {
      const ux = (sx - view.tx) / view.scale, uy = (sy - view.ty) / view.scale;
      return { x: ux * cos - uy * sin, y: ux * sin + uy * cos };
    };
    const corners = [toWorld(0, 0), toWorld(w, 0), toWorld(0, h), toWorld(w, h)];
    const wx0 = Math.min(...corners.map((c) => c.x)), wx1 = Math.max(...corners.map((c) => c.x));
    const wy0 = Math.min(...corners.map((c) => c.y)), wy1 = Math.max(...corners.map((c) => c.y));
    const p0x = anchorPx.x + wx0, p0y = anchorPx.y + wy0;
    const p1x = anchorPx.x + wx1, p1y = anchorPx.y + wy1;
    const minTx = Math.floor(Math.min(p0x, p1x) / TILE_SIZE) - 1;
    const maxTx = Math.ceil(Math.max(p0x, p1x) / TILE_SIZE) + 1;
    const minTy = Math.floor(Math.min(p0y, p1y) / TILE_SIZE) - 1;
    const maxTy = Math.ceil(Math.max(p0y, p1y) / TILE_SIZE) + 1;
    const n = 2 ** BASE_ZOOM;
    const list = [];
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = minTx; tx <= maxTx; tx++) {
        list.push({ tx, ty, wrappedX: ((tx % n) + n) % n });
      }
    }
    return list;
  }, [view.tx, view.ty, view.scale, rotation, width, height]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0, top: 0, transformOrigin: "0 0",
        // Same translate/scale/rotate composition as GisCanvas's toScreen
        // (screen = translate + scale * rotate * world), so the basemap
        // stays georeferenced under the network as the view rotates instead
        // of the two visibly swinging out of alignment.
        transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale}) rotate(${rotation}deg)`,
      }}>
        {tiles.map(({ tx, ty, wrappedX }) => (
          <img key={tx + "_" + ty} alt="" width={TILE_SIZE} height={TILE_SIZE} draggable={false}
            src={`https://tile.openstreetmap.org/${BASE_ZOOM}/${wrappedX}/${ty}.png`}
            style={{ position: "absolute", left: tx * TILE_SIZE - anchorPx.x, top: ty * TILE_SIZE - anchorPx.y, opacity: 0.85 }} />
        ))}
      </div>
    </div>
  );
}
