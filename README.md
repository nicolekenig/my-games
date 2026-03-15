# My Games — Project Structure

## Overview

All games share a single WebStorm project rooted at `my-games/`.
Each game lives in its own folder with exactly **3 files**: `index.html`, `game.js`, and `style.css`.
The root home screen follows the same pattern. A shared `utils.js` lives in `shared/` and is imported by every game.

**Stack:** Plain HTML + CSS + JavaScript — no framework, no build step.
Runs on iPhone, Android, and all desktop browsers out of the box.

---

## Folder Structure

```
my-games/                        ← WebStorm project root
│
├── index.html                   ← Home screen — lists all games
├── style.css                    ← Home screen styles (dark theme)
├── README.md                    ← Project overview
│
├── shared/                      ← Shared code used by every game
│   └── utils.js                 ← Shared helpers (score, sound, input…)
│
├── snake/                       ← One folder per game
│   ├── index.html               ← Game layout + canvas
│   ├── game.js                  ← All game logic
│   ├── style.css                ← Game-specific styles
│   └── README.md                ← Game description + controls
│
├── tetris/
│   ├── index.html
│   ├── game.js
│   ├── style.css
│   └── README.md
│
└── [next-game]/                 ← Copy any game folder to add a new one
    ├── index.html
    ├── game.js
    ├── style.css
    └── README.md
```

---

## File Roles

| File | Purpose |
|---|---|
| `my-games/index.html` | Home screen — card or link for each game |
| `my-games/style.css` | Home screen styles (dark theme, layout) |
| `my-games/README.md` | Project overview |
| `shared/utils.js` | Reusable helpers (score display, keyboard input, etc.) |
| `[game]/index.html` | Game shell — canvas/layout + loads its own style.css and utils.js |
| `[game]/game.js` | All logic for that game — self-contained |
| `[game]/style.css` | Styles for that game — dark theme + any game-specific overrides |
| `[game]/README.md` | Game description, controls, known issues |

---

## Template: `[game]/index.html`

Every game's `index.html` follows this exact pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Game Name</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Game Name</h1>
  <canvas id="game-canvas"></canvas>
  <script src="../shared/utils.js"></script>
  <script src="game.js"></script>
</body>
</html>
```

---

## Template: `[game]/game.js`

```javascript
// ─── Config ───────────────────────────────────────────────────────
const CANVAS = document.getElementById('game-canvas');
const CTX    = CANVAS.getContext('2d');

// ─── State ────────────────────────────────────────────────────────
let state = {};

// ─── Init ─────────────────────────────────────────────────────────
function init() {
  // set up canvas size, initial state
}

// ─── Update ───────────────────────────────────────────────────────
function update() {
  // game logic — called every frame
}

// ─── Draw ─────────────────────────────────────────────────────────
function draw() {
  CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
  // render everything
}

// ─── Loop ─────────────────────────────────────────────────────────
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ─── Input ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // handle keyboard
});

// ─── Start ────────────────────────────────────────────────────────
init();
loop();
```

---

## Template: `[game]/style.css`

```css
/* ─── Base (dark theme) ──────────────────────────────────────────── */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0d0d0d;
  color: #f0f0f0;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  min-height: 100vh;
}

h1 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #7c6ff7;
  margin-bottom: 16px;
  letter-spacing: 0.02em;
}

#game-canvas {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  display: block;
}

/* ─── Game-specific overrides below ─────────────────────────────── */
```

---

## Template: `[game]/README.md`

```markdown
# Game Name

Short description of the game — what it is and the goal.

## Controls

| Key / Gesture | Action        |
|---|---|
| Arrow keys    | Move          |
| Space         | Pause / Start |

## Files

| File        | Purpose                  |
|---|---|
| index.html  | Layout and canvas        |
| game.js     | All game logic           |
| style.css   | Dark theme + game styles |

## Notes

- Any known issues or TODOs
```

---

## Design Rules (Dark Mode)

All games use the same base visual style — defined in each game's own `style.css`:

- **Background:** `#0d0d0d`
- **Surface:** `#1a1a1a`
- **Primary text:** `#f0f0f0`
- **Accent:** `#7c6ff7` (purple)
- **Font:** system-ui, sans-serif
- **Canvas border:** 1px solid `#2a2a2a`

Each game can extend its `style.css` with game-specific rules below the base section.

---

## Adding a New Game — Checklist

1. Create a new folder under `my-games/[game-name]/`
2. Add `index.html` using the template above
3. Add `game.js` using the template above
4. Add `style.css` using the template above
5. Add `README.md` using the template above
6. Add a link/card for the new game in `my-games/index.html`

---

## WebStorm Tips

- Open `my-games/` as the project root (not a subfolder)
- Right-click any `index.html` → **Open In → Browser** to run locally
- No npm, no build step, no config needed
- Use **File | New | Directory** to scaffold a new game folder