// ─── State ────────────────────────────────────────────────────────
let state = {
    myId:        null,
    hostId:      null,
    isHost:      false,
    amDescriber: false,
};

// ─── Init ─────────────────────────────────────────────────────────
/**
 * Initializes the game by connecting to the server, pre-filling the name input,
 * wiring up all button listeners, and registering Socket.IO event handlers.
 */
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
        hide('nextDescriberHint');
        socket.emit('startRound');
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
        hide('myCard');   // reset for everyone; describer's card arrives via yourCard
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

    socket.on('roundEnded', ({ card, guessed, players }) => {
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
        // Show who is up next
        if (players) {
            const nextDesc = players.find(p => p.isDescriber);
            if (nextDesc) {
                const nextEl = document.getElementById('nextDescriberName');
                if (nextEl) nextEl.textContent = nextDesc.name;
                show('nextDescriberHint');
            }
        }
        showScreen('endedScreen');
        updateHostUI();
    });
}

// ─── Update ───────────────────────────────────────────────────────
/**
 * Syncs the local state flags (isHost, amDescriber) from the authoritative player list.
 *
 * @param {Array<Object>} players - The full player list broadcast from the server.
 */
function syncMyState(players) {
    const me = players.find(p => p.id === state.myId);
    if (!me) return;
    state.isHost      = me.isHost;
    state.amDescriber = me.isDescriber;
}

// ─── Draw ─────────────────────────────────────────────────────────
/**
 * Renders the player list into a DOM element, showing avatars, names, and role badges.
 *
 * @param {Array<Object>} players - The player list to render.
 * @param {string} listId - The ID of the container element to populate.
 */
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

/** Shows or hides host-only control panels based on whether the local player is the host. */
function updateHostUI() {
    toggle('hostControls',    state.isHost);
    toggle('hostRoundControls', state.isHost);
    toggle('hostEndControls', state.isHost);
    toggle('nonHostEndStatus', !state.isHost);
}

/**
 * Updates the describer name label and shows the appropriate card (word card or guessing status)
 * depending on whether the local player is the current describer.
 *
 * @param {Array<Object>} players - The full player list from the server.
 */
function updateDescriberUI(players) {
    const desc = players.find(p => p.isDescriber);
    const nameEl = document.getElementById('describerName');
    if (nameEl && desc) nameEl.textContent = desc.name;
    if (state.amDescriber) {
        hide('guessStatus');  // card will appear via yourCard event
    } else {
        hide('myCard');
        show('guessStatus');
    }
}

// ─── Helpers ──────────────────────────────────────────────────────
/**
 * Emits a join event with the player's name from the name input field.
 *
 * @param {Object} socket - The Socket.IO client instance.
 */
function join(socket) {
    const name = document.getElementById('nameInput').value.trim() || 'Player';
    socket.emit('join', name);
}

/**
 * Switches the active screen by removing 'active' from all screens and adding it to the target.
 *
 * @param {string} id - The ID of the screen element to activate.
 */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/** @param {string} id - Removes the 'hidden' class from the element with this ID. */
function show(id)   { document.getElementById(id).classList.remove('hidden'); }
/** @param {string} id - Adds the 'hidden' class to the element with this ID. */
function hide(id)   { document.getElementById(id).classList.add('hidden'); }
/**
 * Shows or hides an element based on a boolean flag.
 *
 * @param {string} id - The ID of the element to toggle.
 * @param {boolean} visible - Whether the element should be visible.
 */
function toggle(id, visible) { visible ? show(id) : hide(id); }

// ─── Start ────────────────────────────────────────────────────────
init();
