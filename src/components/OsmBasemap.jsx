import { useMemo } from "react";

// Demo-only backdrop: real OpenStreetMap raster tiles positioned under the
// network using the same pan/zoom transform as everything else, so it
// visually tracks the canvas. Not a real georeference — the network's world
// coordinates aren't tied to actual lat/lon, this just anchors world (0,0)
// near Upton-upon-Severn (the sample project's namesake) so the backdrop
// looks plausible while demoing.
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

export default function OsmBasemap({ view, width, height }) {
  const tiles = useMemo(() => {
    const w = width || 800, h = height || 600;
    // Visible world-space corners (rotation ignored for the backdrop — it's
    // a decorative layer, not a georeferenced one).
    const wx0 = -view.tx / view.scale, wy0 = -view.ty / view.scale;
    const wx1 = (w - view.tx) / view.scale, wy1 = (h - view.ty) / view.scale;
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
  }, [view.tx, view.ty, view.scale, width, height]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0, top: 0, transformOrigin: "0 0",
        transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
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
