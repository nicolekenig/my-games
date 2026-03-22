# Claude.md — My Games Project Guidelines for Claude

This document is Claude's source of truth for building new games in the My Games project. Read this before creating any new game. All patterns reference the existing games rather than including full templates.

## 🎮 Project Overview

**What:** Local multiplayer party games + single-player games
**Stack:** Plain HTML + CSS + JavaScript + Socket.IO (no frameworks, no build tools)
**Target:** iPhone, Android, desktop browsers (mobile-first)
**Code Philosophy:** Minimal, clean, self-documenting code — less than 150 lines per game

Each game = 1 folder with exactly 4 files:
- `index.html` — Layout & screens
- `game.js` — All logic
- `style.css` — Dark mode styles
- `README.md` — User docs

## 📂 Project Structure

```
my-games/
├── index.html              ← Home screen + game registry
├── style.css               ← Home styles (dark glow)
├── server.js               ← Node.js + Socket.IO (if multiplayer)
├── package.json            ← Dependencies (Socket.IO only)
├── claude.md               ← THIS FILE
├── README.md               ← User overview
│
├── shared/
│   └── utils.js            ← Helpers: getPlayerName(), escapeHtml(), nameToColor()
│
├── forbidden-word/         ← Multiplayer example (110 lines JS)
├── emoji-charades/         ← Multiplayer example (120 lines JS)
├── forehead/               ← Single-player example (85 lines JS)
│
└── [new-game]/             ← Copy any game folder as template
```

## 🎯 Decision: Multiplayer vs Single-Player?

Ask yourself:
- Do players connect to each other in real-time?
- Does the server manage game state (scores, turns, cards)?
- Do I need Socket.IO events?

**YES** → Multiplayer (use Forbidden Word or Emoji Charades as reference)
**NO** → Single-Player (use Forehead as reference)

**Multiplayer Games Need:**
- Socket.IO events (namespaced: `[gameName]:eventName`)
- Server state management in `server.js`
- Room management (players, host, phases)
- `/socket.io/socket.io.js` script in HTML

**Single-Player Games Need:**
- No server, no Socket.IO
- Client-side state only
- No `server.js` updates

## 🎨 Design System: Dark Glow Theme

ALL games use this exact palette. No custom colors.

```css
/* Core colors */
--bg:      #07070f;    /* Main background */
--surface: #0e0e1c;    /* Cards, panels */
--border:  #1c1c38;    /* Card borders */
--text:    #e8e8ff;    /* Primary text */
--muted:   #4a4a72;    /* Labels, hints */
--accent:  #a78bfa;    /* Purple (buttons, glows) */

/* Extended palette (game-specific statuses) */
--success: #16a34a / #4ade80  /* Green bg / text */
--danger:  #c0392b / #f87171  /* Red bg / text */
--warning: #fb923c             /* Orange (secondary) */
```

**Where to apply:**
- Buttons: `btn-primary` = accent bg, white text, glow shadow
- Status boxes: Use extended colors for success/fail/warning states
- Text: Muted color for labels/hints, text color for body
- Cards: Surface bg + border color
- Glows: Only on interactive elements (buttons, headers)

See: `forbidden-word/style.css` or `emoji-charades/style.css` for exact implementation.

## 📱 Mobile-First Requirements (Non-Negotiable)

### Touch Targets
- Minimum size: 44px × 44px
- Standard padding: `15px 18px` (all buttons)
- Width: `100%` (full-width buttons)
- Spacing: `gap: 10px` between buttons
- No `:hover` states — use `:active { transform: scale(0.97); }` instead

### Typography
- Body text: minimum `1rem` (never smaller than `0.8rem`)
- Headers: use `clamp()` for responsive scaling
  - Example: `h1 { font-size: clamp(1.4rem, 6vw, 1.8rem); }`
- Labels: `0.7rem` is okay (supporting text)
- Never hardcode font sizes that don't scale

### Viewport & Layout
- Required meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Body padding: `24px 16px` (breathing room)
- Game screens: `max-width: 480px` (prevents awkward wide layouts)
- Flex column by default (stack vertically)
- Use CSS Grid only for 2-column button layouts: `grid-template-columns: 1fr 1fr; gap: 10px;`

### Testing
- Test on real devices or simulators: iPhone Safari + Android Chrome
- DevTools device mode is not enough
- No horizontal scrolling
- All text readable at smallest screen size

See: `forehead/style.css` and `emoji-charades/style.css` for mobile-optimized examples.

## 🔌 Socket.IO Patterns (Multiplayer Only)

### Core Principle: Server is Source of Truth
- Clients **emit actions** (what the player did)
- Server **validates and broadcasts state** (what changed)
- Clients **never make decisions** about game state

**Bad:** `socket.emit('becomeDescriber')`
**Good:** `socket.emit('startRound')` → Server decides who describes and broadcasts it

### Event Naming
- **Client → Server:** Verb-based, namespaced
  - `join` / `[game]:join` / `[game]:startRound`
- **Server → Client:** Past tense or state nouns
  - `welcome` / `roundStarted` / `players`

### Three Core Events Every Multiplayer Game Needs

**1. JOIN → WELCOME**
```
Client emits:      socket.emit('join', playerName)
Server broadcasts: socket.emit('welcome', { you, hostId, phase })
Server broadcasts: io.emit('players', playerList)
```
See: `forbidden-word/game.js` init function

**2. ROUND START → PLAYING**
```
Client emits:         socket.emit('[game]:startRound')
Server broadcasts:    io.emit('[game]:roundStarted', { players })
Server privately sends: io.to(describerSocket).emit('[game]:yourCard', card)
```
See: `emoji-charades/game.js` `socket.on('emoji:roundStarted'...)`

**3. DISCONNECT → CLEANUP**
```
Server handles: socket.on('disconnect', { ... })
Server reassigns host if needed
Server cleans up player from room state
Server broadcasts: io.emit('players', playerList)
```
See: `server.js` disconnect handler

### Key Rules
- **Validate on server** — don't trust client input
- **Send state deltas, not full state** — only broadcast what changed
- **Handle disconnects gracefully** — reassign host, notify others
- **Use namespaced events** — prefix with `[gameName]:` to avoid conflicts
- **Socket.id is player ID** — reliable and unique

See: `server.js` for Forbidden Word and Emoji Charades Socket.IO patterns.

## 📋 Code Style & Naming Conventions

### File Organization

**index.html:**
- Back button at top: `<a href="/" class="back-btn">← Back</a>`
- Four screens: `joinScreen`, `lobbyScreen`, `playingScreen`, `endedScreen`
- Load `utils.js` BEFORE `game.js`
- Multiplayer: load `/socket.io/socket.io.js` BEFORE `utils.js`

**game.js:**
- Comment sections with dividers: `// ─── Section Name ───`
- State object at top (flat, simple)
- `init()` function called at end
- Helper functions: `showScreen()`, `show()`, `hide()`, `toggle()`
- Socket events organized by feature
- No `console.log()` in production code
- No commented-out code
- Under 150 lines absolute max

**style.css:**
- Base dark theme at top (copy from existing game)
- Game-specific overrides at bottom
- Use CSS variables for colors
- No custom colors — use palette only
- No inline styles in HTML

**README.md:**
- One sentence description
- "How to Play" steps (numbered)
- "Controls" table
- "Files" section
- "Notes" (server requirement, known issues)

### Variable Naming
- `state` — game state object
- `socket` — Socket.IO instance
- `room` — server-side room state (in server.js)
- `players` — array of player objects
- `isHost` / `isDescriber` — boolean flags
- `myId` / `hostId` / `describerId` — socket IDs
- `playerName` — string (from input)
- `btnStart`, `nameInput` — DOM elements (`btn*` or `*Input` suffix)

### Function Naming
- `init()` — initialize game
- `join(socket)` — emit join event
- `showScreen(id)` — switch active screen
- `show(id)` / `hide(id)` / `toggle(id, bool)` — visibility helpers
- `renderPlayers(players, listId)` — update player list
- `syncMyState(players)` — sync local state with server
- `updateUI()` / `updateHostUI()` — refresh UI based on state

## 🧩 File Structure Reference

### Which File Should I Look At?

| Question | Reference |
|---|---|
| "How do I structure HTML screens?" | `emoji-charades/index.html` (multiplayer) or `forehead/index.html` (single-player) |
| "How do I handle button clicks and Socket.IO events?" | `forbidden-word/game.js` (shows join, listeners, socket handlers) |
| "How do I implement a timer?" | `forehead/game.js` (startTimer, pauseTimer, resetTimer functions) |
| "How do I style cards and buttons?" | `emoji-charades/style.css` (base section + game overrides) |
| "How do I manage multiplayer state?" | `server.js` (forbiddenRoom state, getPlayerList(), socket events) |
| "How do I render a player list with avatars and badges?" | `forbidden-word/game.js` renderPlayers() function |
| "How do I handle the describer role?" | `emoji-charades/game.js` updateDescriberUI() function |
| "How do I handle round ending and state transitions?" | `emoji-charades/game.js` socket.on('emoji:wordGuessed'...) and endedScreen |

## ✅ Workflow: Creating a New Game

### Phase 1: Plan
1. Write 1-sentence description
2. Identify: Multiplayer or Single-Player?
3. List screens needed (minimum: join, lobby/playing, ended)
4. List actions (what buttons/keys does the player use?)
5. List game state variables

### Phase 2: Create Folder Structure
```
mkdir my-games/[game-name]/
touch my-games/[game-name]/{index.html,game.js,style.css,README.md}
```

### Phase 3: Build HTML
- Copy structure from reference game (`forbidden-word` or `forehead`)
- Keep screen IDs consistent: `joinScreen`, `lobbyScreen`, `playingScreen`, `endedScreen`
- Include back button: `<a href="/" class="back-btn">← Back</a>`
- Add Socket.IO script if multiplayer
- Add game-specific UI to `playingScreen`

Reference: `emoji-charades/index.html`

### Phase 4: Build game.js
1. Copy state structure (with `myId`, `hostId`, `isHost` for multiplayer)
2. Copy `init()` and basic listeners (join button, name input)
3. Add Socket.IO handlers if multiplayer
4. Add game-specific button listeners
5. Add helper functions: `show()`, `hide()`, `toggle()`, `showScreen()`
6. Keep under 150 lines

Reference: `forbidden-word/game.js` (120 lines, well-organized)

### Phase 5: Build style.css
1. Copy base dark theme from existing game
2. Ensure screens with `.screen` and `.active` classes
3. Add `.hidden` class for visibility
4. Style cards, buttons, status boxes from palette
5. Add game-specific overrides at bottom
6. Test on mobile

Reference: `emoji-charades/style.css` (base + overrides pattern)

### Phase 6: Build README.md
1. One sentence description
2. How to Play (numbered steps)
3. Controls table
4. Files section
5. Notes (server requirement, limitations)

Reference: `emoji-charades/README.md`

### Phase 7: Update server.js (If Multiplayer)
1. Add room state object: `const [gameName]Room = { players, hostId, playerOrder, ... }`
2. Add helper: `function get[GameName]PlayerList() { ... }`
3. Add Socket.IO handlers for all game events
4. Use namespaced events: `[gameName]:join`, `[gameName]:startRound`, etc.
5. Handle disconnect cleanup

Reference: `server.js` (search for "Forbidden Word" or "Emoji Charades" sections)

### Phase 8: Update Home Screen
1. Edit `index.html` GAMES array
2. Add entry: `{ name, desc, path, requiresServer }`

Reference: Current `index.html` GAMES array

### Phase 9: Test Thoroughly
- [ ] Join as 2+ players from different tabs/devices (multiplayer)
- [ ] All buttons work
- [ ] Disconnect/reconnect doesn't crash (multiplayer)
- [ ] Test on iPhone Safari (real device or simulator)
- [ ] Test on Android Chrome (real device or simulator)
- [ ] No console errors
- [ ] Dark mode colors correct

### Phase 10: Final Checklist
- [ ] Code under 150 lines (game.js)
- [ ] No commented-out code
- [ ] Back button present and working
- [ ] Mobile-tested (not just DevTools)
- [ ] Uses only palette colors
- [ ] All buttons are 44px+ touch target
- [ ] README.md complete
- [ ] server.js updated (if multiplayer)
- [ ] Home screen registry updated

## ⚠️ Common Gotchas & Best Practices

### Code
- Don't hardcode colors — use palette only
- Don't create new CSS classes for minor differences — use data attributes or reuse classes
- Don't forget to validate on server — always validate input before accepting
- Don't emit entire state every frame — only emit deltas
- Don't use client as source of truth — server decides everything
- Don't add external libraries — Socket.IO only (already provided)
- Don't use `console.log` in production — remove debug code

### Mobile
- Don't test only on DevTools — use real device or proper simulator
- Don't make buttons smaller than 44px — too hard to tap
- Don't hardcode font sizes — use `clamp()` for responsive scaling
- Don't forget viewport meta tag — required for mobile responsiveness
- Don't have horizontal scroll — test on actual phone screens
- Don't use `:hover` for important feedback — it doesn't work on touch

### Architecture
- Don't store server state on client — server is single source of truth
- Don't skip disconnect handling — users WILL disconnect mid-game
- Don't create custom socket events without prefix — use `[gameName]:` prefix
- Don't trust client IDs from client — socket.id is trusted, player input is not
- Don't forget to reassign host on disconnect — game breaks if host leaves

### Design
- Don't invent new colors — use the palette
- Don't add new button styles — use `btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`
- Don't forget dark mode contrast — test text readability on dark bg
- Don't animate unnecessarily — mobile devices need performance
- Don't make the UI do too much — simpler is better

## 🔍 Testing Checklist

Before marking a game complete:

### Functionality
- [ ] All buttons work (click/tap)
- [ ] Form inputs work (keyboard on mobile)
- [ ] State persists through actions
- [ ] Game can be won/completed
- [ ] Round/game transitions work

### Multiplayer Only
- [ ] Join as 2+ players works
- [ ] Host controls work only for host
- [ ] Non-host players see "waiting" messages
- [ ] Player list updates in real-time
- [ ] Disconnect doesn't crash others
- [ ] Reconnect works (new socket ID assigned)

### Mobile
- [ ] Works on iPhone Safari (actual device)
- [ ] Works on Android Chrome (actual device)
- [ ] All text is readable (no zoom needed)
- [ ] All buttons are tappable (44px minimum)
- [ ] No horizontal scrolling
- [ ] Keyboard doesn't overlap critical UI

### Code Quality
- [ ] No console errors
- [ ] No console warnings
- [ ] game.js under 150 lines
- [ ] No commented-out code
- [ ] All functions have clear names
- [ ] No hardcoded values (use constants or state)

### Design
- [ ] Only palette colors used
- [ ] Cards have correct border and bg
- [ ] Buttons match style of other games
- [ ] Glows only on important elements
- [ ] Typography is consistent
- [ ] Status boxes use correct colors (success/danger/warning)

## 📚 Existing Games as Reference

### Forehead (Single-Player, 85 lines)
**When to reference:** Building a single-player, client-side-only game

Key patterns:
- Simple state object without Socket.IO
- Timer implementation (start, pause, reset, auto-reset)
- Dynamic content selection (character pool)
- Score tracking (correct count, passed count)
- No server or multiplayer logic

Copy from: Game loop structure, timer patterns, state management, HTML screen layout

### Forbidden Word (Multiplayer, 110 lines)
**When to reference:** Building a multiplayer turn-based game with role assignment

Key patterns:
- Room state management with player order
- Role assignment (describer rotation)
- Host-only controls
- Private data (forbidden words sent only to describer)
- Round flow (lobby → describing → ended → lobby)

Copy from: Socket.IO event structure, player list rendering, host/describer UI logic, `updateUI()` patterns

### Emoji Charades (Multiplayer, 120 lines)
**When to reference:** Building a multiplayer real-time game with streaming data

Key patterns:
- Similar to Forbidden Word but with streaming clues
- Real-time message display (emoji stream)
- Input validation (guess matching on server)
- Multiple rounds, same role, then rotate
- Screen transitions between phases

Copy from: `addClue()` and `clearClues()` patterns, real-time clue display, input clearing after submission, round-to-round transitions

## 🎯 Quick Decision Guide

| Question | Answer | Reference |
|---|---|---|
| Is it multiplayer? | Yes | Forbidden Word or Emoji Charades |
| Is it single-player? | Yes | Forehead |
| How do I structure HTML? | Check reference game's index.html | Any existing game |
| How do I organize game.js? | init(), state, helpers, socket handlers, start | `forbidden-word/game.js` |
| How do I style? | Copy base, add overrides, use palette only | `emoji-charades/style.css` |
| How do I handle timers? | startTimer(), pauseTimer(), resetTimer() | `forehead/game.js` |
| How do I manage host? | Assign first joiner, reassign on disconnect | `server.js` |
| How do I rotate roles? | Use playerOrder array + index modulo | `forbidden-word` server.js |
| How do I send private data? | `io.to(socketId).emit()` | `emoji-charades` server.js |
| How do I validate input? | Check on server before emitting | `emoji-charades` submitGuess handler |

## 🚨 What NOT to Do

### Architecture
- ❌ Don't split logic between client and server
- ❌ Don't let clients make game decisions
- ❌ Don't ignore disconnect events
- ❌ Don't create rooms outside of Socket.IO events

### Code
- ❌ Don't use external libraries (except Socket.IO)
- ❌ Don't write game.js longer than 150 lines
- ❌ Don't hardcode data (use state or config)
- ❌ Don't leave debug code in production

### Design
- ❌ Don't invent new colors
- ❌ Don't create new button styles
- ❌ Don't skip mobile optimization
- ❌ Don't forget the back button

### Testing
- ❌ Don't test only on desktop
- ❌ Don't skip DevTools console check
- ❌ Don't assume mobile works because desktop works
- ❌ Don't ship without testing disconnect

## 📞 Quick Troubleshooting

**Socket.IO not connecting:**
- Check `/socket.io/socket.io.js` script is loaded BEFORE `game.js`
- Verify `server.js` is running (`npm start`)
- Check browser console for errors

**Players not syncing:**
- Verify all `socket.on()` handlers exist for all `socket.emit()` calls
- Check event names are spelled exactly the same
- Ensure server broadcasts to `io`, not just `socket`

**Game state out of sync:**
- Verify server is source of truth (not client)
- Check clients are validating input before emitting
- Ensure disconnect handler cleans up properly

**Mobile buttons not working:**
- Use `<button>` elements, not `<div>` with click handlers
- Ensure buttons have minimum 44px touch target
- Check for CSS `pointer-events: none` blocking clicks

**Colors look wrong:**
- Verify colors are from the palette (not custom hex)
- Check contrast in dark mode (use actual device, not just desktop)
- Ensure glows only on important elements

## 📝 Before You Start

1. **Read this file** — You're almost done
2. **Study 1-2 existing games** — Pick one similar to what you're building
3. **Make a plan** — 1 sentence, list screens, list actions
4. **Create folder** — Copy structure, don't start from scratch
5. **Copy references** — Use existing games as templates
6. **Build incrementally** — HTML → game.js → CSS → README
7. **Test on mobile** — Not just browser DevTools
8. **Ship** — Update server.js and home registry

---

### Final Notes
- **Less code is better** — 85-120 lines is target
- **Copy existing patterns** — Don't reinvent, adapt
- **Mobile first** — Always test on real device
- **Dark mode always** — Use the palette
- **Server decides** — Never trust the client
- **Simple UI** — Players understand intuitively

---

*Last Updated: March 2026*
*For: Claude AI + Human Developers*
*Reference: Existing games in `/my-games/` folder*
