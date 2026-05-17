# Dino Run

A simple side‑scrolling dinosaur game written in React + Vite. The game uses an HTML5 canvas for rendering, implements basic physics, obstacle spawning, scoring and a high‑score leaderboard stored in localStorage. The UI is minimal: a start menu, score display and game‑over screen.

## Features

- Canvas rendering with basic 2D shapes (dino, cacti, clouds).
- Gravity and jump physics.
- Random obstacle spawning with increasing speed.
- Score counter that increases over time and when passing obstacles.
- High‑score persistence via `localStorage`.
- Simple UI overlay with start button and restart button.
- Responsive to keyboard (Space / ArrowUp) and touch events.

## How to Run

```bash
cd games/dino-game
npm install
npm run dev   # starts Vite dev server on http://localhost:5173
```

Build for production:

```bash
npm run build   # output in `dist/`
```

## Current State

- **Implemented**: core game loop, physics, obstacle spawning, scoring, UI.
- **Pending**:
  - Sprite animation for the dinosaur.
  - Sound effects (jump, collision).
  - Mobile‑friendly controls (touch gestures).
  - Cross‑browser testing and polyfills.
  - Unit tests for game logic (using Jest).
  - Packaging as a reusable component.

## Project Documentation

See the `memory/dino-game-setup.md` for a detailed task list and future work plan.

## License

MIT
