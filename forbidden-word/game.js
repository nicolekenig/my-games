// ─── State ────────────────────────────────────────────────────────
let state = {
    myId:        null,
    hostId:      null,
    isHost:      false,
    amDescriber: false,
};

// ─── Init ─────────────────────────────────────────────────────────
function init() {
    const socket = io();

    // Pre-fill name from URL or localStorage
    const playerName = getPlayerName();
    document.getElementById('nameInput').value = playerName;

    // Join button & Enter key
    document.getElementById('btnJoin').addEventListener('click', () => join(socket));
    document.getElementById('nameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') join(socket);
    });

    // Host: lobby controls
    document.getElementById('btnStart').addEventListener('click', () => socket.emit('startRound'));
    document.getElementById('btnNextStart').addEventListener('click', () => socket.emit('nextDescriber'));

    // Describer: forbidden word
    document.getElementById('btnForbidden').addEventListener('click', () => socket.emit('forbiddenUsed'));

    // Host: round controls
    document.getElementById('btnGuessed').addEventListener('click', () => socket.emit('wordGuessed'));
    document.getElementById('btnNext').addEventListener('click', () => socket.emit('nextDescriber'));

    // Host: end-screen controls
    document.getElementById('btnNewRound').addEventListener('click', () => {
        hide('revealCard');
        socket.emit('startRound');
    });
    document.getElementById('btnNewRoundNext').addEventListener('click', () => {
        hide('revealCard');
        socket.emit('nextDescriber');
    });

    // ─── Socket events ────────────────────────────────────────────
    socket.on('welcome', ({ you, hostId, phase }) => {
        state.myId   = you;
        state.hostId = hostId;
        state.isHost = (you === hostId);
        showScreen('lobbyScreen');
        updateHostUI();
        if (phase === 'describing') showScreen('describingScreen');
    });

    socket.on('players', players => {
        renderPlayers(players, 'playerList');
        renderPlayers(players, 'playerList2');
        syncMyState(players);
        updateHostUI();
        updateDescriberUI(players);
    });

    socket.on('roundStarted', ({ players }) => {
        renderPlayers(players, 'playerList');
        renderPlayers(players, 'playerList2');
        syncMyState(players);
        updateHostUI();
        updateDescriberUI(players);
        showScreen('describingScreen');
    });

    socket.on('describerChanged', ({ players }) => {
        renderPlayers(players, 'playerList');
        renderPlayers(players, 'playerList2');
        syncMyState(players);
        hide('myCard');
        updateHostUI();
        updateDescriberUI(players);
        showScreen('describingScreen');
    });

    socket.on('yourCard', card => {
        document.getElementById('cardWord').textContent = card.word;
        document.getElementById('forbiddenList').innerHTML =
            card.forbidden.map(w => `<span class="forbidden-tag">🚫 ${escapeHtml(w)}</span>`).join('');
        show('myCard');
        hide('guessStatus');
    });

    socket.on('forbiddenFail', () => {
        document.getElementById('endedBox').className = 'status-box status-fail';
        document.getElementById('endedBox').innerHTML =
            '<span class="big-emoji">💥</span><strong>Forbidden word spoken!</strong>';
        showScreen('endedScreen');
        updateHostUI();
    });

    socket.on('roundEnded', ({ card, guessed }) => {
        const box = document.getElementById('endedBox');
        box.className = guessed ? 'status-box status-success' : 'status-box status-fail';
        box.innerHTML  = guessed
            ? '<span class="big-emoji">🎉</span><strong>Word guessed!</strong>'
            : '<span class="big-emoji">💥</span><strong>Forbidden word spoken!</strong>';
        if (card) {
            document.getElementById('revealWord').textContent = card.word;
            document.getElementById('revealForbidden').innerHTML =
                card.forbidden.map(w => `<span class="forbidden-tag">🚫 ${escapeHtml(w)}</span>`).join('');
            show('revealCard');
        }
        showScreen('endedScreen');
        updateHostUI();
    });
}

// ─── Update ───────────────────────────────────────────────────────
function syncMyState(players) {
    const me = players.find(p => p.id === state.myId);
    if (!me) return;
    state.isHost      = me.isHost;
    state.amDescriber = me.isDescriber;
}

// ─── Draw ─────────────────────────────────────────────────────────
function renderPlayers(players, listId) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    players.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-item';
        const color = nameToColor(p.name);
        const badges = [
            p.isHost      ? '<span class="badge badge-host">Host</span>'         : '',
            p.isDescriber ? '<span class="badge badge-describer">Describer</span>' : '',
            p.id === state.myId ? '<span class="badge badge-you">You</span>'     : '',
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
    toggle('hostControls',    state.isHost);
    toggle('hostRoundControls', state.isHost);
    toggle('hostEndControls', state.isHost);
    toggle('nonHostEndStatus', !state.isHost);
}

function updateDescriberUI(players) {
    const desc = players.find(p => p.isDescriber);
    const nameEl = document.getElementById('describerName');
    if (nameEl && desc) nameEl.textContent = desc.name;
    if (!state.amDescriber) {
        hide('myCard');
        show('guessStatus');
    }
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

// ─── Start ────────────────────────────────────────────────────────
init();
