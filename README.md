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

Use a **Static Site** service:

1. Push this repository to GitHub.
2. In Render, click **New +** → **Static Site**.
3. Connect repository `kk590/test-proj-on-copilot`.
4. Use settings:
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.`
5. Click **Create Static Site**.

Render will host `index.html` directly with no build step.
