const http = require('http');
const fs   = require('fs');
const path = require('path');
const { Server } = require('socket.io');

// ─── Serve static files ───────────────────────────────────────────
const server = http.createServer((req, res) => {
    // Map URL paths to filesystem
    const routes = {
        '/':                 'forbidden-word/index.html',
        '/game.js':          'forbidden-word/game.js',
        '/style.css':        'forbidden-word/style.css',
        '/shared/utils.js':  'shared/utils.js',
    };

    // Resolve path relative to this file's directory
    const base    = __dirname;
    const relPath = routes[req.url] || null;

    if (!relPath) { res.writeHead(404); res.end('Not found'); return; }

    const ext  = path.extname(relPath);
    const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' }[ext] || 'text/plain';

    fs.readFile(path.join(base, relPath), (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

// ─── Cards ────────────────────────────────────────────────────────
const CARDS = [
    { word: 'APPLE',     forbidden: ['fruit','red','tree','iPhone','juice'] },
    { word: 'BEACH',     forbidden: ['sand','ocean','sea','waves','swim'] },
    { word: 'PIANO',     forbidden: ['music','keys','instrument','play','notes'] },
    { word: 'PIZZA',     forbidden: ['cheese','dough','Italy','tomato','slice'] },
    { word: 'SNOW',      forbidden: ['white','cold','winter','ice','fall'] },
    { word: 'LIBRARY',   forbidden: ['books','read','quiet','borrow','shelf'] },
    { word: 'SHARK',     forbidden: ['fish','ocean','teeth','swim','danger'] },
    { word: 'COFFEE',    forbidden: ['drink','caffeine','hot','espresso','morning'] },
    { word: 'BICYCLE',   forbidden: ['ride','wheels','pedal','bike','cycle'] },
    { word: 'MIRROR',    forbidden: ['reflect','glass','look','image','face'] },
    { word: 'CLOUD',     forbidden: ['sky','rain','white','fluffy','weather'] },
    { word: 'GUITAR',    forbidden: ['strings','music','play','instrument','strum'] },
    { word: 'DIAMOND',   forbidden: ['ring','gem','expensive','shiny','hard'] },
    { word: 'VOLCANO',   forbidden: ['lava','fire','erupt','mountain','hot'] },
    { word: 'CHOCOLATE', forbidden: ['sweet','brown','candy','cocoa','dessert'] },
    { word: 'HOSPITAL',  forbidden: ['sick','doctor','nurse','medicine','health'] },
    { word: 'ROCKET',    forbidden: ['space','launch','NASA','fly','fuel'] },
    { word: 'PENGUIN',   forbidden: ['bird','cold','Antarctica','swim','black'] },
    { word: 'THUNDER',   forbidden: ['lightning','storm','loud','rain','sky'] },
    { word: 'CASTLE',    forbidden: ['king','medieval','stone','tower','princess'] },
];

// ─── Room state ───────────────────────────────────────────────────
const room = {
    players:        {},   // socketId → { name, isHost }
    hostId:         null,
    playerOrder:    [],   // socketIds in join order
    describerIndex: 0,
    currentCard:    null,
    phase:          'lobby',
    usedCards:      [],
};

function getPlayerList() {
    return room.playerOrder.map(id => ({
        id,
        name:        room.players[id]?.name || '?',
        isHost:      id === room.hostId,
        isDescriber: room.playerOrder[room.describerIndex] === id,
    }));
}

function pickCard() {
    let pool = CARDS.filter((_, i) => !room.usedCards.includes(i));
    if (pool.length === 0) { room.usedCards = []; pool = CARDS; }
    const idx = CARDS.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    room.usedCards.push(idx);
    return CARDS[idx];
}

// ─── Sockets ──────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {
    socket.on('join', name => {
        const isFirst = Object.keys(room.players).length === 0;
        room.players[socket.id] = { name: name || 'Player', isHost: isFirst };
        room.playerOrder.push(socket.id);
        if (isFirst) room.hostId = socket.id;

        socket.emit('welcome', { you: socket.id, hostId: room.hostId, phase: room.phase });
        io.emit('players', getPlayerList());
    });

    socket.on('startRound', () => {
        if (socket.id !== room.hostId) return;
        room.currentCard = pickCard();
        room.phase = 'describing';
        io.emit('roundStarted', { phase: 'describing', players: getPlayerList() });
        io.to(room.playerOrder[room.describerIndex]).emit('yourCard', room.currentCard);
    });

    socket.on('nextDescriber', () => {
        if (socket.id !== room.hostId) return;
        room.describerIndex = (room.describerIndex + 1) % room.playerOrder.length;
        room.currentCard = pickCard();
        room.phase = 'describing';
        io.emit('describerChanged', { players: getPlayerList() });
        io.to(room.playerOrder[room.describerIndex]).emit('yourCard', room.currentCard);
    });

    socket.on('forbiddenUsed', () => {
        room.phase = 'lobby';
        io.emit('forbiddenFail', { describerId: room.playerOrder[room.describerIndex] });
        io.emit('roundEnded', { card: room.currentCard, guessed: false });
    });

    socket.on('wordGuessed', () => {
        if (socket.id !== room.hostId) return;
        room.phase = 'lobby';
        io.emit('roundEnded', { card: room.currentCard, guessed: true });
    });

    socket.on('disconnect', () => {
        const wasHost = socket.id === room.hostId;
        delete room.players[socket.id];
        room.playerOrder = room.playerOrder.filter(id => id !== socket.id);
        if (room.describerIndex >= room.playerOrder.length) room.describerIndex = 0;
        if (wasHost && room.playerOrder.length > 0) {
            room.hostId = room.playerOrder[0];
            room.players[room.hostId].isHost = true;
        }
        io.emit('players', getPlayerList());
    });
});

// ─── Start ────────────────────────────────────────────────────────
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚫 Forbidden Word Game → http://localhost:${PORT}`);
    console.log('   Share your local IP with friends on the same Wi-Fi\n');
});