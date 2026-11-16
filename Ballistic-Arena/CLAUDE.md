# Handoff for Claude Code

Read README.md, ASSET_HANDOFF.md and the actual code before changes. This is an existing playable prototype; preserve working behaviour and make focused changes requested by Mor. Mor is a 3D artist and will supply final models.

## Implemented rules (code is authoritative)

- Human green bottom defender vs three AI defenders.
- Survival: 10 lives each; elimination at zero; eliminated gates become walls. Last surviving player wins; eliminated human can spectate.
- Challenge: human 8 lives, each AI 12.
- Tournament: three rounds, first to 10 goals wins the round and banks 20 points; others bank their current score. Round scores reset, totals carry across the three rounds. Highest total wins; ties may be shared. A player with 8 points banks 8; there is no separate freeze-at-8 rule.
- New balls start slow. Paddle returns increase speed, strikes increase it further. Walls and ball collisions preserve individual speed. Last paddle owner receives goal credit, excluding own goals.
- Fixed simulation timestep, separate rendering and throttled DOM HUD updates.

## Latest accepted requests

- Direct touch movement feels good to Mor: preserve it.
- Joystick is horizontal only: vertical finger displacement must not reduce speed. Fine near-centre response, immediate movement and stop, independent Strike finger and pointer ownership. Latest adjustment is implemented but user feel has not yet been revalidated.
- Keyboard Left/Right and Space remain supported.
- Portrait and landscape; no orientation lock. Names/scores have a reserved strip outside the gameplay canvas. Respect iPhone safe areas.
- Target 60 FPS. Keep real FPS/1%-low/long-frame diagnostics and adaptive quality. Never claim stable device FPS without measuring it.
- Smooth metallic ball with strong static environment reflections, no external halo/light pool or luminous trail. Last-touch team colour; neutral silver for a fresh/recycled ball. Keep materials independent per ball.

## Architecture and limitations

The application is buildless, with local Three.js vendor modules resolved by the index.html import map. The simulation lives in a compact classic script; rendering is exposed through window.arena3D. Avoid replacing the architecture gratuitously. There are no external runtime model files yet. GLB hooks exist but production animation, Draco/KTX2 and multiplayer are not implemented.

Cloud browser WebGL was unavailable: prior UI QA used the explicit 2D fallback. CPU tests passed; actual GPU appearance, final phone framing and FPS need real hardware review. The fallback is intentionally not visual parity with 3D. Reflections are a static procedural cubemap, not live arena reflections or ray tracing.

Run npm test after changes to input, rules or frame monitoring. Test real multitouch (move + Strike), cancel/release, rotation, pause/resume and recycled-ball colours when relevant. Keep third-party licenses. Do not introduce a new project license on Mor's behalf.

## First message to Claude

Continue this existing Ballistic Arena project. Read CLAUDE.md and README.md, run npm test, then launch npm start. Preserve the current gameplay and direct-touch control. Ask Mor what to improve next rather than rewriting the game. Final models will be supplied by Mor.
