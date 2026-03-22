const { io: Client } = require('socket.io-client');
const { server, io, forbiddenRoom, emojiRoom } = require('../server');

// ─── Helpers ──────────────────────────────────────────────────────
let port;

function resetRooms() {
    Object.assign(forbiddenRoom, {
        players: {}, hostId: null, playerOrder: [],
        describerIndex: 0, currentCard: null, phase: 'lobby', usedCards: [],
    });
    Object.assign(emojiRoom, {
        players: {}, hostId: null, playerOrder: [],
        describerIndex: 0, currentWord: null, phase: 'lobby', usedWords: [],
    });
}

function connect() {
    return new Promise(resolve => {
        const client = new Client(`http://localhost:${port}`);
        client.once('connect', () => resolve(client));
    });
}

function joinForbidden(client, name) {
    return new Promise(resolve => {
        client.emit('join', name);
        client.once('welcome', resolve);
    });
}

function joinEmoji(client, name) {
    return new Promise(resolve => {
        client.emit('emoji:join', name);
        client.once('emoji:welcome', resolve);
    });
}

// ─── Setup / Teardown ─────────────────────────────────────────────
beforeAll(() => new Promise(resolve => {
    server.listen(0, () => {
        port = server.address().port;
        resolve();
    });
}));

afterAll(() => new Promise(resolve => io.close(resolve)));

beforeEach(resetRooms);

// ─── Forbidden Word — joining ─────────────────────────────────────
describe('Forbidden Word — joining', () => {
    let c1, c2;
    beforeEach(async () => { c1 = await connect(); c2 = await connect(); });
    afterEach(() => { c1.disconnect(); c2.disconnect(); });

    test('first joiner is assigned as host', async () => {
        const welcome = await joinForbidden(c1, 'Alice');
        expect(welcome.hostId).toBe(welcome.you);
    });

    test('second joiner is not host', async () => {
        const w1 = await joinForbidden(c1, 'Alice');
        const w2 = await joinForbidden(c2, 'Bob');
        expect(w2.hostId).toBe(w1.you);
        expect(w2.hostId).not.toBe(w2.you);
    });

    test('player list is broadcast to all after each join', done => {
        c2.on('players', players => {
            if (players.length === 2) {
                const names = players.map(p => p.name);
                expect(names).toContain('Alice');
                expect(names).toContain('Bob');
                done();
            }
        });
        c1.emit('join', 'Alice');
        c2.emit('join', 'Bob');
    });

    test('host flag is set correctly in player list', done => {
        joinForbidden(c1, 'Alice').then(() => joinForbidden(c2, 'Bob')).then(() => {
            c1.once('players', players => {
                const alice = players.find(p => p.name === 'Alice');
                const bob   = players.find(p => p.name === 'Bob');
                expect(alice.isHost).toBe(true);
                expect(bob.isHost).toBe(false);
                done();
            });
            c2.emit('join', 'Extra'); // trigger a players broadcast
        });
    });
});

// ─── Forbidden Word — round flow ──────────────────────────────────
describe('Forbidden Word — round flow', () => {
    let host, guest;
    beforeEach(async () => {
        host  = await connect();
        guest = await connect();
        await joinForbidden(host, 'Alice');
        await joinForbidden(guest, 'Bob');
    });
    afterEach(() => { host.disconnect(); guest.disconnect(); });

    test('host can start a round', done => {
        host.emit('startRound');
        host.once('roundStarted', ({ phase }) => {
            expect(phase).toBe('describing');
            done();
        });
    });

    test('describer receives a valid card', done => {
        host.once('yourCard', card => {
            expect(typeof card.word).toBe('string');
            expect(Array.isArray(card.forbidden)).toBe(true);
            expect(card.forbidden).toHaveLength(5);
            done();
        });
        host.emit('startRound');
    });

    test('guest (non-host) cannot start a round', done => {
        let started = false;
        guest.emit('startRound');
        guest.once('roundStarted', () => { started = true; });
        setTimeout(() => { expect(started).toBe(false); done(); }, 200);
    });

    test('host marking word guessed emits roundEnded with guessed=true', done => {
        host.emit('startRound');
        host.once('roundStarted', () => {
            host.emit('wordGuessed');
            host.once('roundEnded', ({ guessed }) => {
                expect(guessed).toBe(true);
                done();
            });
        });
    });

    test('forbiddenUsed emits roundEnded with guessed=false', done => {
        host.emit('startRound');
        host.once('roundStarted', () => {
            host.emit('forbiddenUsed');
            host.once('roundEnded', ({ guessed }) => {
                expect(guessed).toBe(false);
                done();
            });
        });
    });

    test('forbiddenUsed emits forbiddenFail with the describer id', done => {
        host.emit('startRound');
        host.once('roundStarted', () => {
            host.emit('forbiddenUsed');
            guest.once('forbiddenFail', ({ describerId }) => {
                expect(typeof describerId).toBe('string');
                done();
            });
        });
    });

    test('nextDescriber rotates describer and sends new card', done => {
        host.emit('startRound');
        host.once('roundStarted', () => {
            host.emit('nextDescriber');
            // guest is now describer (index 1)
            guest.once('yourCard', card => {
                expect(typeof card.word).toBe('string');
                done();
            });
        });
    });
});

// ─── Forbidden Word — disconnect ──────────────────────────────────
describe('Forbidden Word — disconnect', () => {
    let c1, c2;
    beforeEach(async () => {
        c1 = await connect();
        c2 = await connect();
        await joinForbidden(c1, 'Alice');
        await joinForbidden(c2, 'Bob');
    });
    afterEach(() => {
        if (c1.connected) c1.disconnect();
        if (c2.connected) c2.disconnect();
    });

    test('host transfers to next player when host disconnects', done => {
        c2.on('players', players => {
            const bob = players.find(p => p.name === 'Bob');
            if (bob?.isHost) { done(); }
        });
        c1.disconnect();
    });

    test('player list shrinks after disconnect', done => {
        c2.on('players', players => {
            if (players.length === 1) {
                expect(players[0].name).toBe('Bob');
                done();
            }
        });
        c1.disconnect();
    });
});

// ─── Emoji Charades — joining ─────────────────────────────────────
describe('Emoji Charades — joining', () => {
    let c1, c2;
    beforeEach(async () => { c1 = await connect(); c2 = await connect(); });
    afterEach(() => { c1.disconnect(); c2.disconnect(); });

    test('first joiner is host', async () => {
        const welcome = await joinEmoji(c1, 'Alice');
        expect(welcome.hostId).toBe(welcome.you);
    });

    test('second joiner is not host', async () => {
        const w1 = await joinEmoji(c1, 'Alice');
        const w2 = await joinEmoji(c2, 'Bob');
        expect(w2.hostId).toBe(w1.you);
        expect(w2.hostId).not.toBe(w2.you);
    });
});

// ─── Emoji Charades — round flow ─────────────────────────────────
describe('Emoji Charades — round flow', () => {
    let host, guest;
    beforeEach(async () => {
        host  = await connect();
        guest = await connect();
        await joinEmoji(host, 'Alice');
        await joinEmoji(guest, 'Bob');
    });
    afterEach(() => { host.disconnect(); guest.disconnect(); });

    test('host can start a round', done => {
        host.emit('emoji:startRound');
        host.once('emoji:roundStarted', () => done());
    });

    test('describer (host) receives the secret word', done => {
        host.once('emoji:yourWord', word => {
            expect(typeof word).toBe('string');
            expect(word.length).toBeGreaterThan(0);
            done();
        });
        host.emit('emoji:startRound');
    });

    test('guest (non-host) cannot start a round', done => {
        let started = false;
        guest.emit('emoji:startRound');
        guest.once('emoji:roundStarted', () => { started = true; });
        setTimeout(() => { expect(started).toBe(false); done(); }, 200);
    });

    test('describer can send a clue and all players receive it', done => {
        host.emit('emoji:startRound');
        host.once('emoji:roundStarted', () => {
            host.emit('emoji:sendClue', '🦈');
            guest.once('emoji:clueReceived', ({ clue }) => {
                expect(clue).toBe('🦈');
                done();
            });
        });
    });

    test('non-describer cannot send a clue', done => {
        host.emit('emoji:startRound');
        host.once('emoji:roundStarted', () => {
            let received = false;
            guest.emit('emoji:sendClue', '🦈');
            host.once('emoji:clueReceived', () => { received = true; });
            setTimeout(() => { expect(received).toBe(false); done(); }, 200);
        });
    });

    test('correct guess ends the round', done => {
        host.once('emoji:yourWord', word => {
            guest.emit('emoji:submitGuess', word);
            host.once('emoji:wordGuessed', ({ word: guessedWord }) => {
                expect(guessedWord).toBe(word);
                done();
            });
        });
        host.emit('emoji:startRound');
    });

    test('correct guess is case-insensitive', done => {
        host.once('emoji:yourWord', word => {
            guest.emit('emoji:submitGuess', word.toLowerCase());
            host.once('emoji:wordGuessed', () => done());
        });
        host.emit('emoji:startRound');
    });

    test('wrong guess does not end the round', done => {
        host.emit('emoji:startRound');
        host.once('emoji:roundStarted', () => {
            let ended = false;
            guest.emit('emoji:submitGuess', '__DEFINITELY_WRONG_XYZ__');
            host.once('emoji:wordGuessed', () => { ended = true; });
            setTimeout(() => { expect(ended).toBe(false); done(); }, 200);
        });
    });

    test('host can skip the word', done => {
        host.emit('emoji:startRound');
        host.once('emoji:roundStarted', () => {
            host.emit('emoji:skipWord');
            host.once('emoji:wordSkipped', ({ word }) => {
                expect(typeof word).toBe('string');
                done();
            });
        });
    });

    test('guest cannot skip the word', done => {
        host.emit('emoji:startRound');
        host.once('emoji:roundStarted', () => {
            let skipped = false;
            guest.emit('emoji:skipWord');
            host.once('emoji:wordSkipped', () => { skipped = true; });
            setTimeout(() => { expect(skipped).toBe(false); done(); }, 200);
        });
    });
});

// ─── Emoji Charades — disconnect ─────────────────────────────────
describe('Emoji Charades — disconnect', () => {
    let c1, c2;
    beforeEach(async () => {
        c1 = await connect();
        c2 = await connect();
        await joinEmoji(c1, 'Alice');
        await joinEmoji(c2, 'Bob');
    });
    afterEach(() => {
        if (c1.connected) c1.disconnect();
        if (c2.connected) c2.disconnect();
    });

    test('player list shrinks after disconnect', done => {
        c2.on('emoji:players', players => {
            if (players.length === 1) {
                expect(players[0].name).toBe('Bob');
                done();
            }
        });
        c1.disconnect();
    });

    test('host transfers to next player when host disconnects', done => {
        c2.on('emoji:players', players => {
            const bob = players.find(p => p.name === 'Bob');
            if (bob?.isHost) { done(); }
        });
        c1.disconnect();
    });
});
