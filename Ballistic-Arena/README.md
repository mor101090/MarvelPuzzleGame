# Ballistic Arena — Neon District

Playable browser-game prototype for Mor. JavaScript + Three.js r180, with procedural placeholder vehicles and robots. No build step or npm dependencies are required. Three.js and its license are included in `dist/vendor/three/`.

## Quick start

Install Node.js, open a terminal in this folder, then run:

```sh
npm start
```

Open http://localhost:8080. Do not double-click index.html: ES modules need an HTTP server.
Alternative with Python: `python -m http.server 8080 --directory dist`.
For an iPhone on the same Wi-Fi, open `http://YOUR-PC-IP:8080`; the local firewall must permit the server. The Node server is for local development only.

## Controls

- Phone: direct touch positioning or left joystick; right Strike button. Portrait and landscape both supported.
- Keyboard: Left/Right arrows or A/D to move; Space to strike/start; P or Escape to pause.
- Mouse: click/drag the arena to position your vehicle.

## Project map

| File | Responsibility |
| --- | --- |
| `dist/index.html` | App structure, controls, module loading and 2D fallback |
| `dist/style.css` | Desktop/iPhone layouts, safe areas and separate score strip |
| `dist/game.js` | Simulation, collisions, AI, rules, input and audio |
| `dist/scene.js` | Three.js arena, camera, rendering and adaptive quality |
| `dist/models.js` | Procedural models, metallic ball, team colours and GLB hooks |
| `dist/optimize.js` | Static mesh batching |
| `dist/performance.js` | FPS, 1% low and long-frame monitoring |
| `dist/fallback.js` | Labelled Canvas 2D compatibility renderer |
| `tests/` | Simulation, input and performance tests |
| `ASSET_HANDOFF.md` | Model dimensions, pivots and material conventions |
| `CLAUDE.md` | Development handoff and constraints |

## Tests

```sh
npm test
```

Tests passed at export. GPU rendering, real iPhone touch feel and stable 60 FPS still require device testing. The FPS counter measures actual frame timing; 60 FPS is the target, not a guarantee.

## Git and hosting

Extract the ZIP, open this directory and run:

```sh
git init
git add .
git commit -m "Initial Ballistic Arena prototype"
git branch -M main
```

Create an empty repository in your Git provider, then use its supplied remote URL and push instructions. No Git remote, history, credentials or original Sites account binding is included in this export.

For static hosting, publish the contents of **dist/**; it already contains the runnable application. Preserve relative paths and the vendor directory. GitHub Pages requires a publishing setup that uploads dist as the site artifact; simply pushing this project does not automatically enable hosting.

The interface currently loads Google Fonts; system fallbacks remain available without that connection. No backend or database is required. No multiplayer, persistent account system or production animated models are implemented.

## ריצה והמשך עבודה

חלץ את הקובץ, פתח את תיקיית Ballistic-Arena ב-Claude Code וקרא תחילה את CLAUDE.md.
הרצה: `npm start`, ואז פתח בדפדפן http://localhost:8080.
כל קוד המשחק נמצא ב-dist. המודלים כרגע זמניים, וניתן להחליף אותם לפי ASSET_HANDOFF.md.
