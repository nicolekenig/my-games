# 🎮 My Games - Setup Guide

## Quick Start (Local Play)

### Prerequisites
- **Node.js** installed on your computer ([Download here](https://nodejs.org/))

### Steps

1. **Download or clone this project**
   ```bash
   git clone [your-repo-url]
   cd my-games
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
    - Go to: `http://localhost:3000`
    - Enter your name
    - Click "Play" on any game

5. **For multiplayer (same Wi-Fi network)**
    - Find your computer's IP address:
        - **Windows**: Run `ipconfig` in CMD, look for "IPv4 Address"
        - **Mac/Linux**: Run `ifconfig` or `ip addr`, look for your local IP
    - Share with friends: `http://YOUR-IP:3000`
    - Example: `http://192.168.1.5:3000`

---

## 🌐 GitHub Pages Hosting

### What Works
- ✅ The home page displays correctly
- ✅ Single-player games (coming soon)
- ✅ Simple browser-based games

### What DOESN'T Work
- ❌ **Forbidden Word** (requires Node.js server for real-time multiplayer)
- ❌ Any game using Socket.IO

### Why?
GitHub Pages only hosts **static files** (HTML, CSS, JS). It cannot run a Node.js server for real-time features.

### Solution
For multiplayer games, you need to:
1. **Run locally** with `npm start`, OR
2. **Deploy to a platform that supports Node.js**:
    - [Railway](https://railway.app/)
    - [Render](https://render.com/)
    - [Heroku](https://www.heroku.com/)
    - [Glitch](https://glitch.com/)

---

## 📁 Project Structure

```
my-games/
├── index.html           ← Home page (works everywhere)
├── style.css            ← Home page styles
├── server.js            ← Node.js server (needed for multiplayer)
├── package.json         ← Dependencies
│
├── shared/
│   └── utils.js         ← Shared helper functions
│
└── forbidden-word/      ← Multiplayer game
    ├── index.html
    ├── game.js
    ├── style.css
    └── README.md
```

---

## 🔧 Troubleshooting

### "404 - File Not Found" on GitHub Pages
- **Cause:** The server isn't running (multiplayer games need a server)
- **Fix:** Run `npm start` and use `localhost:3000`

### "Cannot find module 'socket.io'"
- **Cause:** Dependencies not installed
- **Fix:** Run `npm install`

### Port 3000 already in use
- **Fix:** Change the port in `server.js`:
  ```javascript
  const PORT = 3001; // Change this number
  ```

### Players can't connect on Wi-Fi
- Make sure all devices are on the **same Wi-Fi network**
- Check your **firewall** isn't blocking port 3000
- Use your computer's **local IP address**, not `localhost`

---

## 🎯 Adding Single-Player Games

To add games that work on GitHub Pages:

1. **Create a new game folder**
   ```
   my-games/new-game/
   ```

2. **Add 3 files:**
    - `index.html` (game layout)
    - `game.js` (game logic - NO socket.io)
    - `style.css` (dark theme styles)

3. **Register in home page**
   Edit `index.html`, add to GAMES array:
   ```javascript
   const GAMES = [
       { 
           name: 'My New Game', 
           desc: 'A fun single-player game', 
           path: 'new-game/index.html',
           requiresServer: false  // Works on GitHub Pages!
       },
       // ...
   ];
   ```

4. **Examples of single-player games:**
    - Snake
    - Tetris
    - Memory Match
    - Tic-Tac-Toe
    - Flappy Bird
    - 2048
    - Minesweeper

---

## 📱 Mobile Play

All games are mobile-friendly and work on:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)
- ✅ iPad/Tablets
- ✅ Desktop browsers

For multiplayer:
1. Start server on your computer
2. Find your computer's IP address
3. On phone, open browser and go to: `http://YOUR-IP:3000`

---

## 🚀 Deployment Options

### Option 1: Local Only
- Run `npm start` on your computer
- Share your local IP with friends on same Wi-Fi
- **Pros:** Easy, free
- **Cons:** Only works when your computer is on

### Option 2: Railway (Free Tier Available)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Option 3: Render (Free Tier Available)
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repo
5. Set build command: `npm install`
6. Set start command: `npm start`

---

## 💡 Tips

- **Testing locally first:** Always test with `npm start` before deploying
- **Keep it simple:** Single-player games work better for static hosting
- **Dark mode:** All games use the same dark theme for consistency
- **Mobile-first:** Design works great on phones and tablets

---

## 🆘 Need Help?

1. Check this SETUP.md file
2. Read the README.md for project structure
3. Check each game's README for specific controls
4. Make sure Node.js is installed: `node --version`
5. Make sure dependencies are installed: `npm install`

---

**Enjoy your games! 🎮**