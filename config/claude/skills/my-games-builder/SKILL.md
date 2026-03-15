---
name: my-games-builder
description: Build new multiplayer party games for the My Games project. Use this skill whenever the user wants to create a new game, add a game to their collection, build a party game, create a multiplayer game with Socket.IO, or requests any game similar to Forbidden Word, charades, Pictionary, or other social games. Also trigger when the user mentions "my-games project", "add to my games", or shows files from the my-games folder structure.
---

# My Games Builder

This skill helps you create **multiplayer party games** that fit seamlessly into the My Games project structure. Every game follows strict conventions for consistency, mobile-first design, and minimal code.

## When to Use This Skill

Trigger this skill when:
- User wants to create a new game for the My Games project
- User mentions adding a multiplayer/party game
- User asks for games like: Forbidden Word, charades, Pictionary, Heads Up, trivia, word games, drawing games, voting games
- User shows files from `my-games/` folder or mentions the project by name
- User wants to modify/extend an existing game in the project

## Project Architecture Overview

```
my-games/
├── index.html           ← Home screen (auto-detects server status)
├── style.css            ← Home styles
├── server.js            ← Node.js + Socket.IO server
├── shared/
│   └── utils.js         ← Shared helpers
└── [game-name]/         ← Each game is a folder
    ├── index.html       ← 3 required files (templates below)
    ├── game.js          ← Client-side logic + Socket.IO
    ├── style.css        ← Dark theme styles
    └── README.md        ← Game docs
```

**Stack:** Plain HTML + CSS + JavaScript + Socket.IO  
**No frameworks, no build tools, no bundlers.**

---

## Step-by-Step Game Creation Workflow

### Step 1: Understand the Game Concept

Ask the user these questions (don't ask all at once — adapt based on their initial request):

1. **Game name** — What should we call it?
2. **Core mechanic** — What do players do? (describe, guess, draw, vote, answer, etc.)
3. **Turn structure** — Is there one active player per round, or everyone plays simultaneously?
4. **Win condition** — How does a round end? (word guessed, timer expires, voting complete, etc.)
5. **Content** — Does the game need a deck of cards/questions/prompts? (built-in or user-generated?)
6. **Mobile controls** — What interactions are needed? (buttons, text input, drawing canvas, voting buttons, etc.)

**Example:**
- User: "I want to make a drawing game like Pictionary"
- You ask: "Should there be a word bank, or do players choose what to draw? Is there a timer per turn?"

### Step 2: Design the Socket.IO Events

Based on the game mechanics, map out the **client ↔ server communication**:

**Standard events every game needs:**
```javascript
// Client → Server
socket.emit('join', playerName)           // Join room
socket.emit('disconnect')                  // Leave room

// Server → Client
socket.on('welcome', { you, hostId, phase })  // Assigned ID + room state
socket.on('players', playerList)              // Updated player list
```

**Game-specific events** (examples):
```javascript
// Drawing game
socket.emit('startDrawing', { drawerId })
socket.emit('drawStroke', { x, y, color })
socket.emit('submitGuess', guess)
socket.on('correctGuess', { playerId, word })

// Voting game
socket.emit('submitVote', { targetId })
socket.on('votingResults', { votes })
```

**Design principle:** Keep events **minimal**. One event per user action. Server validates and broadcasts.

### Step 3: Plan the UI Screens

Every multiplayer game has **3-4 screens**:

1. **Join Screen** (`#joinScreen`)
    - Name input + "Join Game" button

2. **Lobby Screen** (`#lobbyScreen`)
    - Player list with avatars
    - "Waiting for host..." message (non-hosts)
    - "Start Round" button (host only)

3. **Playing Screen** (`#playingScreen` or `#describingScreen`, etc.)
    - Active gameplay UI
    - Role-specific elements (only the drawer sees the word, etc.)
    - Host controls (if needed)

4. **Results/End Screen** (`#endedScreen`)
    - Show outcome (who won, what the answer was, etc.)
    - "New Round" button (host only)

**Screen switching:**
```javascript
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
```

### Step 4: Generate the Game Files

You will create **4 files** in `/home/claude/[game-name]/`:

#### 4A. `index.html` Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Game Name]</title>
    <link rel="stylesheet" href="style.css">
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
<h1>[Emoji] [Game Name]</h1>

<!-- JOIN SCREEN -->
<div id="joinScreen" class="screen active">
    <div class="card">
        <label class="field-label">Your name</label>
        <input id="nameInput" type="text" placeholder="Enter your name…" maxlength="20" autocomplete="off"/>
        <button id="btnJoin" class="btn-primary">Join Game</button>
    </div>
</div>

<!-- LOBBY SCREEN -->
<div id="lobbyScreen" class="screen">
    <div class="card">
        <div class="section-title">Players in room</div>
        <div id="playerList" class="player-list"></div>
    </div>
    <div id="lobbyStatus" class="status-box status-waiting">Waiting for the host to start…</div>
    <div id="hostControls" class="host-controls hidden">
        <button id="btnStart" class="btn-primary">▶ Start Round</button>
    </div>
</div>

<!-- PLAYING SCREEN (customize based on game) -->
<div id="playingScreen" class="screen">
    <!-- Game-specific UI here -->
</div>

<!-- END SCREEN -->
<div id="endedScreen" class="screen">
    <div id="endedBox" class="status-box"></div>
    <div id="hostEndControls" class="host-controls hidden">
        <button id="btnNewRound" class="btn-primary">▶ New Round</button>
    </div>
</div>

<script src="../shared/utils.js"></script>
<script src="game.js"></script>
</body>
</html>
```

**Mobile controls:** Auto-generate touch-friendly buttons for all actions. Use `<button>` elements with CSS classes like `.btn-primary`, `.btn-success`, `.btn-danger`.

#### 4B. `game.js` Template

```javascript
// ─── State ────────────────────────────────────────────────────────
let state = {
    myId:        null,
    hostId:      null,
    isHost:      false,
    // Add game-specific state here
};

// ─── Init ─────────────────────────────────────────────────────────
function init() {
    const socket = io();

    // Pre-fill name from URL or localStorage
    const playerName = getPlayerName();
    document.getElementById('nameInput').value = playerName;

    // Join button + Enter key
    document.getElementById('btnJoin').addEventListener('click', () => join(socket));
    document.getElementById('nameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') join(socket);
    });

    // Add game-specific button listeners here
    
    // ─── Socket Events ────────────────────────────────────────────
    socket.on('welcome', ({ you, hostId, phase }) => {
        state.myId   = you;
        state.hostId = hostId;
        state.isHost = (you === hostId);
        showScreen('lobbyScreen');
        updateHostUI();
    });

    socket.on('players', players => {
        renderPlayers(players, 'playerList');
        syncMyState(players);
        updateHostUI();
    });

    // Add game-specific socket listeners here
}

// ─── Helpers ──────────────────────────────────────────────────────
function join(socket) {
    const name = document.getElementById('nameInput').value.trim() || 'Player';
    socket.emit('join', name);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function show(id)   { document.getElementById(id).classList.remove('hidden'); }
function hide(id)   { document.getElementById(id).classList.add('hidden'); }
function toggle(id, visible) { visible ? show(id) : hide(id); }

function syncMyState(players) {
    const me = players.find(p => p.id === state.myId);
    if (!me) return;
    state.isHost = me.isHost;
    // Update other state properties based on player data
}

function renderPlayers(players, listId) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-item';
        const color = nameToColor(p.name);
        const badges = [
            p.isHost ? '<span class="badge badge-host">Host</span>' : '',
            p.id === state.myId ? '<span class="badge badge-you">You</span>' : '',
        ].join('');
        div.innerHTML = `
            <div class="player-avatar" style="background:${color}">${escapeHtml(p.name[0].toUpperCase())}</div>
            <div class="player-name">${escapeHtml(p.name)}</div>
            ${badges}
        `;
        list.appendChild(div);
    });
}

function updateHostUI() {
    toggle('hostControls', state.isHost);
    toggle('hostEndControls', state.isHost);
}

// ─── Start ────────────────────────────────────────────────────────
init();
```

#### 4C. `style.css` (Dark Theme)

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

/* ─── Screens ────────────────────────────────────────────────────── */
.screen { display: none; width: 100%; max-width: 480px; flex-direction: column; gap: 12px; }
.screen.active { display: flex; }
.hidden { display: none !important; }

/* ─── Cards ───────────────────────────────────────────────────────── */
.card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* ─── Labels ──────────────────────────────────────────────────────── */
.field-label,
.section-title {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 1.1px;
    color: #666;
}

/* ─── Inputs ──────────────────────────────────────────────────────── */
input[type="text"] {
    background: #0d0d0d;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    padding: 12px 14px;
    color: #f0f0f0;
    font-family: system-ui, sans-serif;
    font-size: 1rem;
    width: 100%;
    outline: none;
    transition: border-color 0.15s;
}
input[type="text"]:focus { border-color: #7c6ff7; }

/* ─── Buttons ─────────────────────────────────────────────────────── */
button {
    cursor: pointer;
    font-family: system-ui, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    border: none;
    border-radius: 12px;
    padding: 13px 18px;
    width: 100%;
    transition: transform 0.1s, opacity 0.1s;
}
button:active { transform: scale(0.97); opacity: 0.85; }
button:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-primary   { background: #7c6ff7; color: #fff; }
.btn-secondary { background: #1a1a1a; color: #f0f0f0; border: 1px solid #2a2a2a; }
.btn-danger    { background: #c0392b; color: #fff; }
.btn-success   { background: #22c55e; color: #fff; }

.host-controls { display: flex; flex-direction: column; gap: 8px; }

/* ─── Status Boxes ────────────────────────────────────────────────── */
.status-box {
    border-radius: 14px;
    padding: 16px;
    font-size: 0.95rem;
    line-height: 1.5;
    text-align: center;
}
.status-waiting    { background: #1a1a1a; border: 1px solid #2a2a2a; color: #666; }
.status-active     { background: #12102a; border: 1px solid #3a3470; color: #a89af0; }
.status-fail       { background: #1a0a0a; border: 1px solid #5c1a1a; color: #e05555; }
.status-success    { background: #0a1a0f; border: 1px solid #1a5c32; color: #22c55e; }

.big-emoji { font-size: 2rem; display: block; margin-bottom: 6px; }
.hint { font-size: 0.82rem; color: #666; }

/* ─── Player List ─────────────────────────────────────────────────── */
.player-list { display: flex; flex-direction: column; gap: 8px; }

.player-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #0d0d0d;
    border: 1px solid #2a2a2a;
    border-radius: 10px;
    font-size: 0.9rem;
}

.player-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.8rem;
    flex-shrink: 0;
    color: #fff;
}

.player-name { flex: 1; }

.badge {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 3px 7px;
    border-radius: 20px;
    text-transform: uppercase;
}
.badge-host { background: #1a1200; color: #ff8c42; border: 1px solid #ff8c42; }
.badge-you  { background: #1a1a1a; color: #666; border: 1px solid #2a2a2a; }

/* ─── Game-specific styles below ────────────────────────────────── */
```

**Mobile-first:** All buttons are `width: 100%` and touch-friendly (min 44px height). No hover states needed.

#### 4D. `README.md`

```markdown
# [Game Name]

[Short description — what players do and the goal]

## Controls

| Key / Gesture | Action |
|---|---|
| Tap "[Button]" | [What it does] |

## Files

| File | Purpose |
|---|---|
| index.html | Layout and screens |
| game.js | All game logic |
| style.css | Dark theme + game styles |

## Notes

- Requires `server.js` running (Node.js + Socket.IO)
- All players must be on the same Wi-Fi network
- First player to join becomes the host
- [Any game-specific rules or known issues]

## How to Play

1. Start server: `npm start` (runs on port 3000)
2. All players open `http://[server-ip]:3000/[game-name]/`
3. First player becomes the host
4. [Step-by-step gameplay instructions]
```

### Step 5: Update `server.js`

Add the game's Socket.IO logic to the existing `server.js`. **Do not replace the entire file** — just add your game's event handlers.

**Pattern:**
```javascript
// ─── [Game Name] Room State ───────────────────────────────────────
const [game]Room = {
    players: {},
    hostId: null,
    playerOrder: [],
    // game-specific state
};

// ─── [Game Name] Helpers ──────────────────────────────────────────
function [game]GetPlayerList() {
    return [game]Room.playerOrder.map(id => ({
        id,
        name: [game]Room.players[id]?.name || '?',
        isHost: id === [game]Room.hostId,
        // game-specific player properties
    }));
}

// ─── [Game Name] Socket Events ────────────────────────────────────
io.on('connection', socket => {
    socket.on('[game]:join', name => {
        const isFirst = Object.keys([game]Room.players).length === 0;
        [game]Room.players[socket.id] = { name: name || 'Player' };
        [game]Room.playerOrder.push(socket.id);
        if (isFirst) [game]Room.hostId = socket.id;

        socket.emit('[game]:welcome', { 
            you: socket.id, 
            hostId: [game]Room.hostId 
        });
        io.emit('[game]:players', [game]GetPlayerList());
    });

    // Add game-specific events here

    socket.on('disconnect', () => {
        const wasHost = socket.id === [game]Room.hostId;
        delete [game]Room.players[socket.id];
        [game]Room.playerOrder = [game]Room.playerOrder.filter(id => id !== socket.id);
        if (wasHost && [game]Room.playerOrder.length > 0) {
            [game]Room.hostId = [game]Room.playerOrder[0];
        }
        io.emit('[game]:players', [game]GetPlayerList());
    });
});
```

**Critical:** Use **namespaced events** (e.g., `drawing:submitStroke`) to avoid conflicts between games sharing the same server.

### Step 6: Register in `index.html`

Add the game to the `GAMES` array in the root `index.html`:

```javascript
const GAMES = [
    {
        name: '[Game Name]',
        desc: '[Short description]',
        path: '[game-folder]/index.html',
        requiresServer: true
    },
    // ... other games
];
```

### Step 7: Create Output Package

Copy all files to `/mnt/user-data/outputs/[game-name]/` and use `present_files` to share:
- `[game-name]/index.html`
- `[game-name]/game.js`
- `[game-name]/style.css`
- `[game-name]/README.md`
- `server.js` (updated version)
- `index.html` (updated GAMES array)

---

## Code Quality Standards

### Minimal Code
- **Target:** Each game under 200 lines of JS
- No libraries except Socket.IO (already loaded)
- Use `shared/utils.js` helpers (`getPlayerName()`, `nameToColor()`, `escapeHtml()`)
- No redundant comments — code should be self-documenting

### Mobile-First
- All buttons: `width: 100%`, `padding: 13px 18px`
- Touch targets: minimum 44px × 44px
- No `:hover` states (use `:active` instead)
- Viewport meta tag: `width=device-width, initial-scale=1.0`
- Test on iPhone and Android simulators if possible

### Dark Mode Consistency
Use these exact colors across all games:
- Background: `#0d0d0d`
- Surface: `#1a1a1a`
- Border: `#2a2a2a`
- Text: `#f0f0f0`
- Muted: `#666`
- Accent: `#7c6ff7`
- Success: `#22c55e`
- Danger: `#c0392b`

### Socket.IO Best Practices
- **Client validates inputs before emitting** (trim strings, bounds-check numbers)
- **Server is the source of truth** — all state lives on the server
- **Emit only deltas** — don't send the entire game state every frame
- **Use `socket.id` as player ID** — reliable and unique
- **Handle disconnects gracefully** — reassign host if needed

---

## Common Game Patterns

### Pattern: Drawing/Canvas Game
```javascript
// Client: capture touch/mouse and emit strokes
canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    socket.emit('drawStroke', { x: e.offsetX, y: e.offsetY, color });
});

// Server: broadcast to everyone except the drawer
socket.on('drawStroke', stroke => {
    socket.broadcast.emit('drawUpdate', stroke);
});
```

### Pattern: Turn-Based with Timer
```javascript
// Server: set timer for each turn
let turnTimer = setTimeout(() => {
    io.emit('turnEnded', { reason: 'timeout' });
    nextTurn();
}, 30000); // 30 seconds

// Clean up on manual turn end
socket.on('endTurn', () => {
    clearTimeout(turnTimer);
    nextTurn();
});
```

### Pattern: Voting/Polling
```javascript
// Client: submit vote
socket.emit('vote', { choice: 'option-a' });

// Server: collect votes and broadcast when everyone voted
const votes = {};
socket.on('vote', choice => {
    votes[socket.id] = choice;
    if (Object.keys(votes).length === playerCount) {
        io.emit('votingComplete', tallyVotes(votes));
    }
});
```

### Pattern: Simultaneous Input (like Kahoot)
```javascript
// Everyone submits at the same time, fastest wins bonus
socket.on('submitAnswer', (answer, timestamp) => {
    answers.push({ playerId: socket.id, answer, timestamp });
    socket.emit('submitted'); // Show "waiting for others"
});
```

---

## Testing Checklist

Before marking a game as complete, test:

- [ ] Join as 2+ players from different devices/tabs
- [ ] Host controls only appear for the first player
- [ ] Non-hosts see "Waiting for host..." messages
- [ ] Game progresses correctly through all screens
- [ ] Disconnect/rejoin doesn't crash the game
- [ ] Mobile: all buttons are tappable (no tiny targets)
- [ ] Mobile: text is readable (no font < 0.8rem except labels)
- [ ] Dark mode colors match the standard palette
- [ ] Game works on iPhone Safari and Android Chrome

---

## Example Game Ideas (for inspiration)

### Simple (30 min build)
- **Hot Seat** — Answer rapid-fire questions, majority vote if you passed
- **Two Truths** — Everyone submits two truths and a lie, vote on which is the lie
- **Quick Draw** — 60 seconds to draw something, fastest correct guess wins

### Medium (1-2 hours)
- **Telephone Pictionary** — Alternate between drawing and describing
- **Fake Artist** — One player doesn't know the word, group votes on who's faking
- **Wavelength** — Guess where a clue falls on a spectrum (cold → hot)

### Complex (2-4 hours)
- **Spyfall** — Everyone's at the same location except one spy
- **Codenames** — Two teams, spymasters give one-word clues
- **Mafia** — Social deduction with day/night phases

---

## Troubleshooting

### "Socket.IO not connecting"
- Check `<script src="/socket.io/socket.io.js"></script>` is loaded **before** `game.js`
- Verify `server.js` is running: `npm start`
- Test in browser console: `typeof io` should return `"function"`

### "Players not syncing"
- Ensure all `socket.emit()` calls have matching `socket.on()` handlers
- Check for typos in event names (case-sensitive)
- Use Chrome DevTools → Network → WS tab to see WebSocket messages

### "Mobile buttons not working"
- Use `<button>` elements, not `<div>` with click handlers
- Check `touch-action: manipulation` in CSS (prevents zoom delay)
- Test with real device, not just Chrome DevTools device mode

### "Game state gets out of sync"
- Server should be the **only** source of truth
- Clients should emit actions, server broadcasts updates
- Never rely on client-side state for game logic

---

## Final Deliverables

When you finish creating a game, provide:

1. **Game folder** with 4 files (index.html, game.js, style.css, README.md)
2. **Updated server.js** with the new game's Socket.IO events
3. **Updated root index.html** with the game registered in the GAMES array
4. **Brief explanation** in chat:
    - How to play (2-3 sentences)
    - What makes it fun
    - Any known limitations

Copy everything to `/mnt/user-data/outputs/` and use `present_files` to share with the user.

---

## Remember

- **Mobile-first:** Design for touch, not mouse
- **Minimal code:** Under 200 lines per game
- **Dark mode:** Use the standard color palette
- **Socket.IO:** Keep events simple and validate on server
- **Test on real devices:** iPhone Safari and Android Chrome

Now go build something fun! 🎮