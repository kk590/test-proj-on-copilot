# Mini Foot Frenzy

Browser-based Three.js starter for a colorful 3D mini football game.

## Current web starter scope

- Scene setup with sky/fog, lighting, and cartoon field
- Simple stands + colorful crowd blobs
- Third-person follow camera
- Player controller (WASD/Arrow movement + Shift sprint)
- Kick charge meter and kick input (mouse hold/release or `K`)
- Basic ball velocity + gravity + bounce physics
- Basic 1v1 AI opponent movement
- Responsive HUD + touch button controls

Main files:

- `/home/runner/work/test-proj-on-copilot/test-proj-on-copilot/index.html`
- `/home/runner/work/test-proj-on-copilot/test-proj-on-copilot/js/game.js`
- `/home/runner/work/test-proj-on-copilot/test-proj-on-copilot/js/player.js`
- `/home/runner/work/test-proj-on-copilot/test-proj-on-copilot/js/ball.js`
- `/home/runner/work/test-proj-on-copilot/test-proj-on-copilot/js/ai.js`

## Run locally

Use any static server from repository root.

Example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy on Render.com

This repository now includes `/home/runner/work/test-proj-on-copilot/test-proj-on-copilot/render.yaml`, so you can deploy with a **Blueprint**.

1. Push this repository to GitHub.
2. In Render, click **New +** → **Blueprint**.
3. Connect repository `kk590/test-proj-on-copilot`.
4. Click **Apply**.

Render will create a static site and host `index.html` directly with no build step.
