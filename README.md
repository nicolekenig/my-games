# My Games - Complete Working Project

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Open Browser
```
http://localhost:3000
```

---

## 📁 Project Structure

```
my-games/
├── server.js              ← Node.js server (handles files + multiplayer)
├── package.json           ← Dependencies
├── index.html             ← Home page
├── style.css              ← Home page styles
│
├── shared/
│   └── utils.js           ← Helper functions
│
└── forbidden-word/
    ├── index.html         ← Game page
    ├── game.js            ← Game logic
    └── style.css          ← Game styles
```

---

## ✅ How It Works

1. **Start server:** `npm start`
2. **Server runs on port 3000**
3. **Server serves all files** (index.html, CSS, JS, etc.)
4. **Socket.IO handles multiplayer** communication
5. **Players connect** via browser to `localhost:3000`

---

## 🎮 To Play

1. Open `http://localhost:3000` in browser
2. Enter your name
3. Click "Play" on Forbidden Word
4. First player becomes host
5. Host clicks "Start Round"
6. Play the game!

---

## 🌐 Multiplayer (Same Wi-Fi)

### Find Your IP:
**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

**Windows:**
```bash
ipconfig
```

### Share With Friends:
```
http://YOUR-IP:3000
Example: http://192.168.1.5:3000
```

---

## 🛠️ Troubleshooting

### Error: "Cannot find module 'socket.io'"
**Fix:** Run `npm install`

### Error: "Port 3000 already in use"
**Fix:** Change port in `server.js`:
```javascript
const PORT = 3001; // Change this
```

### 404 Error
**Make sure:**
- Server is running (`npm start`)
- You're going to `http://localhost:3000` (not opening file directly)
- All files are in correct folders

---

## ✨ This Project Includes

- ✅ Working server (serves files + Socket.IO)
- ✅ Home page with player name
- ✅ Forbidden Word multiplayer game
- ✅ Dark mode design
- ✅ Mobile-friendly
- ✅ Debug logging in server

---

**Ready to play!** 🎮
