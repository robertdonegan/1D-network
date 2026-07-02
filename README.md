# Flood Modeller v8.0 — 1D Modelling (interactive prototype)

High-fidelity recreation of the FM v8.0 "Reach Connectors" frame: full app shell
(OS title bar, FM 1D mode ribbon, Project hierarchy panel, 1D Network data panel)
with an interactive GIS canvas in the centre.

Built with React + Vite. All icons are the real exported SVGs, bundled locally —
no CDN, nothing that expires.

## Prerequisites
- Node.js 18+ (`node -v`)

## Run locally
```bash
npm install     # first time only
npm run dev
```
Open the printed URL (default http://localhost:5173).

## Interactive canvas
- **Open a ribbon menu** (River ▾, Boundaries ▾, Conduits ▾, Weirs ▾, Bridges ▾,
  Storage ▾, Junction ▾, Advanced ▾). Menus mirror the real app, including the
  two-level flyouts (River → Muskingum, Boundaries → Hydrographs).
- **Drag a leaf item** from the menu onto the canvas → places that unit as a node.
- **Hover a node** → four blue connector dots appear at its edges (Mural-style).
- **Drag a connector** to another node → creates a reach (rust-coloured line).
- **Drag a node** to reposition.
- **Click a reach midpoint** → delete it.
- **Select a node** → a red × appears beside it; or press Delete/Backspace.

The canvas also has the left tool rail (select / rectangle / measure / query /
comment / edit) and the right nav controls (compass / zoom / pan) as static chrome.

### Icons
All icons are your uploaded SVGs. Menu items whose icons weren't in the zip
(CES Section, Replicate, Muskingum variants, Head-Time, Abstraction, FEH, ReFH,
etc.) use a neutral dashed placeholder — drop in the exported SVG under
`src/assets/` and map it in `src/components/ModeRibbon.jsx` (the `icon` key) to
make them exact.

## Open in Zed + work with the Claude agent
```bash
git init
git add .
git commit -m "FM v8.0 1D modelling prototype"
git remote add origin <your-repo-url>
git push -u origin main
```
Then in Zed: open the folder (or clone the remote), and the Claude agent can read
and edit any file under `src/`. Component map:
- `src/components/OSWindow.jsx`     — blue title bar
- `src/components/ModeRibbon.jsx`   — mode tabs + tool ribbon
- `src/components/ProjectPanel.jsx` — left project hierarchy
- `src/components/GisCanvas.jsx`    — interactive centre canvas (the logic lives here)
- `src/components/NetworkPanel.jsx` — right 1D network tables
- `src/tokens.css`                  — exact Figma design tokens (colours, spacing, type)
- `src/assets.jsx`                  — central asset imports

## Share with others to test
Same Wi-Fi:
```bash
npm run dev -- --host      # use the printed Network: URL
```
Anywhere (temporary public link), with the dev server running:
```bash
npx localtunnel --port 5173
```

## Deploy to GitHub Pages
Automated workflow included at `.github/workflows/deploy.yml`. Push to `main`, then
Settings → Pages → Source: **GitHub Actions**. Site publishes to
`https://<user>.github.io/<repo>/`. (`base: "./"` in vite.config.js keeps asset paths
relative, so it works at any subpath.)

## Notes on fidelity
- Colours, spacing, type sizes, and geometry come directly from the Figma variables
  (`get_variable_defs`) and layout data — not eyeballed.
- All icons are your uploaded SVGs. The tool palette on the canvas is an added
  affordance for the interaction; it isn't part of the original static frame.
