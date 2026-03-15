# My Games

Local multiplayer party games — plain HTML + CSS + JavaScript + Socket.IO.  
No frameworks, no build tools, mobile-friendly, dark mode.

## 🎮 Games Included

1. **🚫 Forbidden Word** — Describe a word without using forbidden words
2. **🎭 Emoji Charades** — Describe a word using only emojis

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000
```

## 📱 Multiplayer Setup

All players must be on the **same Wi-Fi network**:

1. Find your computer's IP address:
    - **Windows:** Run `ipconfig` in CMD
    - **Mac/Linux:** Run `ifconfig` or `ip addr`

2. Share with friends: `http://YOUR-IP:3000`
    - Example: `http://192.168.1.5:3000`

3. Everyone opens that URL on their phone/tablet

## 📁 Project Structure

```
my-games/
├── index.html              ← Home screen
├── style.css               ← Home styles
├── server.js               ← Node.js + Socket.IO server
├── package.json            ← Dependencies
│
├── shared/
│   └── utils.js            ← Shared helpers
│
├── forbidden-word/
│   ├── index.html
│   ├── game.js
│   ├── style.css
│   └── README.md
│
└── emoji-charades/
    ├── index.html
    ├── game.js
    ├── style.css
    └── README.md
```

## 🎨 Design

- **Dark mode** — Consistent purple accent (#7c6ff7)
- **Mobile-first** — Touch-friendly buttons, responsive layout
- **Minimal code** — Each game under 200 lines of JS

## 🛠️ Tech Stack

- Plain HTML + CSS + JavaScript
- Socket.IO for real-time multiplayer
- Node.js server
- No frameworks, no build step

## 📝 License

Free to use and modify!