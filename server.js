const http = require('http');
const fs   = require('fs');
const path = require('path');
const { Server } = require('socket.io');

// ─── Serve static files ───────────────────────────────────────────
const server = http.createServer((req, res) => {
    // Remove query parameters from the URL
    const url = req.url.split('?')[0];
    let filePath = '.' + url;

    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js':   'application/javascript',
        '.css':  'text/css',
        '.json': 'application/json',
        '.png':  'image/png',
        '.jpg':  'image/jpg',
        '.gif':  'image/gif',
        '.svg':  'image/svg+xml',
        '.ico':  'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// ─── Forbidden Word Cards ─────────────────────────────────────────
const FORBIDDEN_CARDS = [
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

// ─── Emoji Charades Words ─────────────────────────────────────────
const EMOJI_WORDS = [
    // Movies
    'TITANIC', 'STAR WARS', 'FROZEN', 'AVATAR', 'JAWS', 'THE MATRIX', 'JURASSIC PARK',
    // Objects
    'PIZZA', 'GUITAR', 'RAINBOW', 'MOUNTAIN', 'AIRPLANE', 'CAMERA', 'BICYCLE',
    // Actions
    'DANCING', 'SWIMMING', 'SLEEPING', 'RUNNING', 'COOKING', 'SINGING', 'FLYING',
    // Famous People
    'EINSTEIN', 'SHAKESPEARE', 'CLEOPATRA', 'MONA LISA', 'PICASSO',
    // Animals
    'ELEPHANT', 'BUTTERFLY', 'OCTOPUS', 'UNICORN', 'DINOSAUR',
    // Places
    'PARIS', 'EGYPT', 'JUNGLE', 'DESERT', 'BEACH',
    // Concepts
    'LOVE', 'TIME', 'MUSIC', 'DREAM', 'CELEBRATION'
];

// ─── Forbidden Word Room State ────────────────────────────────────
const forbiddenRoom = {
    players:        {},
    hostId:         null,
    playerOrder:    [],
    describerIndex: 0,
    currentCard:    null,
    phase:          'lobby',
    usedCards:      [],
};

function getForbiddenPlayerList() {
    return forbiddenRoom.playerOrder.map(id => ({
        id,
        name:        forbiddenRoom.players[id]?.name || '?',
        isHost:      id === forbiddenRoom.hostId,
        isDescriber: forbiddenRoom.playerOrder[forbiddenRoom.describerIndex] === id,
    }));
}

function pickForbiddenCard() {
    let pool = FORBIDDEN_CARDS.filter((_, i) => !forbiddenRoom.usedCards.includes(i));
    if (pool.length === 0) { forbiddenRoom.usedCards = []; pool = FORBIDDEN_CARDS; }
    const idx = FORBIDDEN_CARDS.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    forbiddenRoom.usedCards.push(idx);
    return FORBIDDEN_CARDS[idx];
}

// ─── Emoji Charades Room State ────────────────────────────────────
const emojiRoom = {
    players:        {},
    hostId:         null,
    playerOrder:    [],
    describerIndex: 0,
    currentWord:    null,
    phase:          'lobby',
    usedWords:      [],
};

function getEmojiPlayerList() {
    return emojiRoom.playerOrder.map(id => ({
        id,
        name:        emojiRoom.players[id]?.name || '?',
        isHost:      id === emojiRoom.hostId,
        isDescriber: emojiRoom.playerOrder[emojiRoom.describerIndex] === id,
    }));
}

function pickEmojiWord() {
    let pool = EMOJI_WORDS.filter((_, i) => !emojiRoom.usedWords.includes(i));
    if (pool.length === 0) { emojiRoom.usedWords = []; pool = EMOJI_WORDS; }
    const idx = EMOJI_WORDS.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    emojiRoom.usedWords.push(idx);
    return EMOJI_WORDS[idx];
}

// ─── Socket.IO ────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', socket => {

    // ─── FORBIDDEN WORD EVENTS ────────────────────────────────────
    socket.on('join', name => {
        const isFirst = Object.keys(forbiddenRoom.players).length === 0;
        forbiddenRoom.players[socket.id] = { name: name || 'Player', isHost: isFirst };
        forbiddenRoom.playerOrder.push(socket.id);
        if (isFirst) forbiddenRoom.hostId = socket.id;

        socket.emit('welcome', { you: socket.id, hostId: forbiddenRoom.hostId, phase: forbiddenRoom.phase });
        io.emit('players', getForbiddenPlayerList());
    });

    socket.on('startRound', () => {
        if (socket.id !== forbiddenRoom.hostId) return;
        forbiddenRoom.currentCard = pickForbiddenCard();
        forbiddenRoom.phase = 'describing';
        io.emit('roundStarted', { phase: 'describing', players: getForbiddenPlayerList() });
        io.to(forbiddenRoom.playerOrder[forbiddenRoom.describerIndex]).emit('yourCard', forbiddenRoom.currentCard);
    });

    socket.on('nextDescriber', () => {
        if (socket.id !== forbiddenRoom.hostId) return;
        forbiddenRoom.describerIndex = (forbiddenRoom.describerIndex + 1) % forbiddenRoom.playerOrder.length;
        forbiddenRoom.currentCard = pickForbiddenCard();
        forbiddenRoom.phase = 'describing';
        io.emit('describerChanged', { players: getForbiddenPlayerList() });
        io.to(forbiddenRoom.playerOrder[forbiddenRoom.describerIndex]).emit('yourCard', forbiddenRoom.currentCard);
    });

    socket.on('forbiddenUsed', () => {
        forbiddenRoom.phase = 'lobby';
        io.emit('forbiddenFail', { describerId: forbiddenRoom.playerOrder[forbiddenRoom.describerIndex] });
        io.emit('roundEnded', { card: forbiddenRoom.currentCard, guessed: false });
    });

    socket.on('wordGuessed', () => {
        if (socket.id !== forbiddenRoom.hostId) return;
        forbiddenRoom.phase = 'lobby';
        io.emit('roundEnded', { card: forbiddenRoom.currentCard, guessed: true });
    });

    // ─── EMOJI CHARADES EVENTS ────────────────────────────────────
    socket.on('emoji:join', name => {
        const isFirst = Object.keys(emojiRoom.players).length === 0;
        emojiRoom.players[socket.id] = { name: name || 'Player' };
        emojiRoom.playerOrder.push(socket.id);
        if (isFirst) emojiRoom.hostId = socket.id;

        socket.emit('emoji:welcome', { you: socket.id, hostId: emojiRoom.hostId, phase: emojiRoom.phase });
        io.emit('emoji:players', getEmojiPlayerList());
    });

    socket.on('emoji:startRound', () => {
        if (socket.id !== emojiRoom.hostId) return;
        emojiRoom.currentWord = pickEmojiWord();
        emojiRoom.phase = 'playing';
        io.emit('emoji:roundStarted', { players: getEmojiPlayerList() });
        io.to(emojiRoom.playerOrder[emojiRoom.describerIndex]).emit('emoji:yourWord', emojiRoom.currentWord);
    });

    socket.on('emoji:nextDescriber', () => {
        if (socket.id !== emojiRoom.hostId) return;
        emojiRoom.describerIndex = (emojiRoom.describerIndex + 1) % emojiRoom.playerOrder.length;
        emojiRoom.currentWord = pickEmojiWord();
        emojiRoom.phase = 'playing';
        io.emit('emoji:describerChanged', { players: getEmojiPlayerList() });
        io.to(emojiRoom.playerOrder[emojiRoom.describerIndex]).emit('emoji:yourWord', emojiRoom.currentWord);
    });

    socket.on('emoji:sendClue', clue => {
        const describer = emojiRoom.playerOrder[emojiRoom.describerIndex];
        if (socket.id !== describer) return;
        const describerName = emojiRoom.players[socket.id]?.name || 'Someone';
        io.emit('emoji:clueReceived', { clue, describerName });
    });

    socket.on('emoji:submitGuess', guess => {
        if (!emojiRoom.currentWord) return;
        const normalized = guess.trim().toLowerCase();
        const answer = emojiRoom.currentWord.toLowerCase();

        if (normalized === answer) {
            const guesserName = emojiRoom.players[socket.id]?.name || 'Someone';
            emojiRoom.phase = 'ended';
            io.emit('emoji:wordGuessed', { guesserName, word: emojiRoom.currentWord });
        }
    });

    socket.on('emoji:skipWord', () => {
        if (socket.id !== emojiRoom.hostId) return;
        emojiRoom.phase = 'ended';
        io.emit('emoji:wordSkipped', { word: emojiRoom.currentWord });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
        // Forbidden Word cleanup
        const wasForbiddenHost = socket.id === forbiddenRoom.hostId;
        delete forbiddenRoom.players[socket.id];
        forbiddenRoom.playerOrder = forbiddenRoom.playerOrder.filter(id => id !== socket.id);
        if (forbiddenRoom.describerIndex >= forbiddenRoom.playerOrder.length) forbiddenRoom.describerIndex = 0;
        if (wasForbiddenHost && forbiddenRoom.playerOrder.length > 0) {
            forbiddenRoom.hostId = forbiddenRoom.playerOrder[0];
            forbiddenRoom.players[forbiddenRoom.hostId].isHost = true;
        }
        io.emit('players', getForbiddenPlayerList());

        // Emoji Charades cleanup
        const wasEmojiHost = socket.id === emojiRoom.hostId;
        delete emojiRoom.players[socket.id];
        emojiRoom.playerOrder = emojiRoom.playerOrder.filter(id => id !== socket.id);
        if (emojiRoom.describerIndex >= emojiRoom.playerOrder.length) emojiRoom.describerIndex = 0;
        if (wasEmojiHost && emojiRoom.playerOrder.length > 0) {
            emojiRoom.hostId = emojiRoom.playerOrder[0];
        }
        io.emit('emoji:players', getEmojiPlayerList());
    });
});

// ─── Start ────────────────────────────────────────────────────────
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎮 My Games Server`);
    console.log(`   → http://localhost:${PORT}`);
    console.log(`   Share your local IP with friends on the same Wi-Fi\n`);
});