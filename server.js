const http = require('http');
const fs   = require('fs');
const path = require('path');
const { Server } = require('socket.io');

// ─── API helpers ──────────────────────────────────────────────────
/**
 * Writes a JSON response with the given HTTP status code.
 *
 * @param {http.ServerResponse} res - The HTTP response object.
 * @param {number} status - The HTTP status code to send.
 * @param {Object} data - The data to serialize as the response body.
 */
function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me';

/**
 * Reads and parses the JSON body from an incoming HTTP request.
 * Destroys the request if the body exceeds 10 KB.
 *
 * @param {http.IncomingMessage} req - The HTTP request object.
 * @returns {Promise<Object>} Resolves with the parsed body, or an empty object on error.
 */
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 10_000) { req.destroy(); resolve({}); }
        });
        req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    });
}

// ─── Serve static files ───────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    // Remove query parameters from the URL
    const url = req.url.split('?')[0];

    // ─── Add-Words API ────────────────────────────────────────────
    if (url.startsWith('/api/words/') && req.method === 'POST') {
        if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
            return json(res, 401, { error: 'Unauthorized' });
        }
    }

    if (url === '/api/words/forbidden' && req.method === 'POST') {
        const { word, forbidden } = await parseBody(req);
        const normalized = (word || '').trim().toUpperCase();
        if (!normalized || !Array.isArray(forbidden) || forbidden.length !== 5) {
            return json(res, 400, { error: 'Word and exactly 5 forbidden words are required' });
        }
        if (FORBIDDEN_CARDS.some(c => c.word === normalized)) {
            return json(res, 409, { error: `"${normalized}" already exists in the Forbidden Word database` });
        }
        FORBIDDEN_CARDS.push({ word: normalized, forbidden: forbidden.map(f => (f || '').trim().toLowerCase()) });
        return json(res, 200, { success: true });
    }

    if (url === '/api/words/emoji' && req.method === 'POST') {
        const { word } = await parseBody(req);
        const normalized = (word || '').trim().toUpperCase();
        if (!normalized) return json(res, 400, { error: 'Word is required' });
        if (EMOJI_WORDS.includes(normalized)) {
            return json(res, 409, { error: `"${normalized}" already exists in the Emoji Charades database` });
        }
        EMOJI_WORDS.push(normalized);
        return json(res, 200, { success: true });
    }

    if (url === '/api/words/forehead' && req.method === 'POST') {
        const { word } = await parseBody(req);
        const normalized = (word || '').trim();
        if (!normalized) return json(res, 400, { error: 'Character name is required' });
        if (FOREHEAD_CHARACTERS.some(c => c.toLowerCase() === normalized.toLowerCase())) {
            return json(res, 409, { error: `"${normalized}" already exists in the Forehead database` });
        }
        FOREHEAD_CHARACTERS.push(normalized);
        return json(res, 200, { success: true });
    }

    // ─── Static files ─────────────────────────────────────────────
    let filePath = '.' + url;

    if (filePath.endsWith('/')) {
        filePath += 'index.html';
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

/**
 * Returns the current Forbidden Word player list with id, name, isHost, and isDescriber flags.
 *
 * @returns {Array<Object>} The formatted player list.
 */
function getForbiddenPlayerList() {
    return forbiddenRoom.playerOrder.map(id => ({
        id,
        name:        forbiddenRoom.players[id]?.name || '?',
        isHost:      id === forbiddenRoom.hostId,
        isDescriber: forbiddenRoom.playerOrder[forbiddenRoom.describerIndex] === id,
    }));
}

/**
 * Picks a random unused card from FORBIDDEN_CARDS, avoiding repeats until the pool is exhausted.
 *
 * @returns {Object} A card object with `word` and `forbidden` properties.
 */
function pickForbiddenCard() {
    let pool = FORBIDDEN_CARDS.filter((_, i) => !forbiddenRoom.usedCards.includes(i));
    if (pool.length === 0) { forbiddenRoom.usedCards = []; pool = FORBIDDEN_CARDS; }
    const idx = FORBIDDEN_CARDS.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    forbiddenRoom.usedCards.push(idx);
    return FORBIDDEN_CARDS[idx];
}

// ─── Forehead Characters ──────────────────────────────────────────
const FOREHEAD_CHARACTERS = [
    // Movie Stars
    'Tom Cruise', 'Brad Pitt', 'Leonardo DiCaprio', 'Scarlett Johansson', 'Jennifer Lawrence',
    'Will Smith', 'Angelina Jolie', 'Johnny Depp', 'Emma Watson', 'Robert Downey Jr.',
    'Chris Hemsworth', 'Gal Gadot', 'Dwayne Johnson', 'Meryl Streep', 'Morgan Freeman',
    // Fictional Characters
    'Harry Potter', 'Batman', 'Superman', 'Wonder Woman', 'Iron Man', 'Spider-Man',
    'Elsa (Frozen)', 'Darth Vader', 'Sherlock Holmes', 'James Bond', 'Indiana Jones',
    'Hermione Granger', 'Luke Skywalker', 'Mickey Mouse', 'Shrek',
    // Singers
    'Taylor Swift', 'Beyoncé', 'Ed Sheeran', 'Ariana Grande', 'Justin Bieber',
    'Adele', 'Lady Gaga', 'Drake', 'Rihanna', 'Bruno Mars', 'The Weeknd',
    'Billie Eilish', 'Post Malone', 'Eminem', 'Madonna',
    // Models & Influencers
    'Kim Kardashian', 'Gigi Hadid', 'Bella Hadid', 'Kendall Jenner', 'Cara Delevingne',
    // Israeli Celebrities
    'Bar Refaeli', 'Omer Adam', 'Netta Barzilai', 'Lior Raz',
    'Rotem Sela', 'Yael Shelbia', 'Noa Kirel', 'Eyal Golan', 'Moshe Peretz',
    'Idan Raichel', 'Keren Peles', 'Sarit Hadad', 'Ivri Lider', 'Shlomo Artzi',
    'Kobi Peretz', 'Anna Zak', 'Nasrin Kadri', 'Lucy Ayoub', 'Shira Haas',
    // Sports & Other
    'Lionel Messi', 'Cristiano Ronaldo', 'LeBron James', 'Serena Williams',
    'Elon Musk', 'Mark Zuckerberg', 'Oprah Winfrey', 'Barack Obama',
];

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

/**
 * Returns the current Emoji Charades player list with id, name, isHost, and isDescriber flags.
 *
 * @returns {Array<Object>} The formatted player list.
 */
function getEmojiPlayerList() {
    return emojiRoom.playerOrder.map(id => ({
        id,
        name:        emojiRoom.players[id]?.name || '?',
        isHost:      id === emojiRoom.hostId,
        isDescriber: emojiRoom.playerOrder[emojiRoom.describerIndex] === id,
    }));
}

/**
 * Picks a random unused word from EMOJI_WORDS, avoiding repeats until the pool is exhausted.
 *
 * @returns {string} The selected word.
 */
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
        // Auto-advance to next describer in rotation
        forbiddenRoom.describerIndex = (forbiddenRoom.describerIndex + 1) % forbiddenRoom.playerOrder.length;
        io.emit('roundEnded', { card: forbiddenRoom.currentCard, guessed: false, players: getForbiddenPlayerList() });
    });

    socket.on('wordGuessed', () => {
        if (socket.id !== forbiddenRoom.hostId) return;
        forbiddenRoom.phase = 'lobby';
        // Auto-advance to next describer in rotation
        forbiddenRoom.describerIndex = (forbiddenRoom.describerIndex + 1) % forbiddenRoom.playerOrder.length;
        io.emit('roundEnded', { card: forbiddenRoom.currentCard, guessed: true, players: getForbiddenPlayerList() });
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
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🎮 My Games Server`);
        console.log(`   → http://localhost:${PORT}`);
        console.log(`   Share your local IP with friends on the same Wi-Fi\n`);
    });
}

module.exports = { server, io, forbiddenRoom, emojiRoom, FORBIDDEN_CARDS, EMOJI_WORDS, FOREHEAD_CHARACTERS };