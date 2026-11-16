# Neon District — placeholder asset contract

Three.js r180. All engine files are hosted locally; no external model assets are required.

- Field: 20 × 20 metres on XZ; Y up. The simulation maps `(coordinate - 450) / 35` to world metres.
- Vehicle: 3.15 m wide, 1.8 m deep. Pivot at floor centre, forward +Z.
- Robot: separate seated mesh under RobotMount at local (0, 0.8, -0.18).
- Ball: 0.51 m diameter; origin at centre.
- Goal opening: 13.714 m. Models never determine collision geometry.

Place production GLBs in `dist/assets/` and edit `ASSETS` paths in `dist/models.js`.
Materials whose names begin `Team` are tinted by player colour. `TeamEmission` also receives the team emissive colour. Embedded PBR textures; 2K suggested. Loader currently supports static/posed GLB assets. AnimationMixer and Draco/KTX2 support can be added when final animated assets arrive.

Controls: portrait and landscape; left horizontal joystick and right Strike button, independent pointers. Desktop Left/Right or A/D and Space; direct touch/mouse positioning also works. No forced orientation lock. Mobile names/scores occupy a separate strip above the arena. AUTO 60 reduces render resolution under sustained frame pressure. Mobile starts without bloom; shadows are disabled.

The ball is a smooth metallic sphere (metalness 1, roughness 0.12), using a shared static reflection environment. No ball glow pool or trail is rendered. Its colour follows the last paddle owner, reverting to silver on new balls. Reflections are environment-map reflections, not live ray tracing.

Validation: Node simulation, pointer lifecycle and performance-monitor tests. WebGL was unavailable in the cloud browser; final GPU appearance and real iPhone performance need device validation. 60 FPS is a target, not a device-verified guarantee.
