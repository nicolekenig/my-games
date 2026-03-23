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
 * wiring up all button and keyboard listeners, and registering Socket.IO event handlers.
 */
function init() {
    const socket = io();

    const playerName = getPlayerName();
    document.getElementById('nameInput').value = playerName;

    // Join button + Enter key
    document.getElementById('btnJoin').addEventListener('click', () => join(socket));
    document.getElementById('nameInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') join(socket);
    });

    // Host: lobby controls
    document.getElementById('btnStart').addEventListener('click', () => {
        socket.emit('emoji:startRound');
    });

    // Describer: send emoji clue
    document.getElementById('btnSendEmoji').addEventListener('click', () => {
        const clue = document.getElementById('emojiInput').value.trim();
        if (clue) {
            socket.emit('emoji:sendClue', clue);
            document.getElementById('emojiInput').value = '';
        }
    });

    // Guesser: submit guess + Enter key
    document.getElementById('btnSubmitGuess').addEventListener('click', () => submitGuess(socket));
    document.getElementById('guessInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitGuess(socket);
    });

    // Host: round controls
    document.getElementById('btnSkip').addEventListener('click', () => {
        socket.emit('emoji:skipWord');
    });
    document.getElementById('btnNextDescriber').addEventListener('click', () => {
        socket.emit('emoji:nextDescriber');
    });

    // Host: end-screen controls
    document.getElementById('btnNewRound').addEventListener('click', () => {
        socket.emit('emoji:startRound');
    });
    document.getElementById('btnNewRoundNext').addEventListener('click', () => {
        socket.emit('emoji:nextDescriber');
    });

    // ─── Socket Events ────────────────────────────────────────────
    socket.on('emoji:welcome', ({ you, hostId, phase }) => {
        state.myId   = you;
        state.hostId = hostId;
        state.isHost = (you === hostId);
        showScreen('lobbyScreen');
        updateHostUI();
        if (phase === 'playing') showScreen('playingScreen');
    });

    socket.on('emoji:players', players => {
        renderPlayers(players, 'playerList');
        renderPlayers(players, 'playerList2');
        syncMyState(players);
        updateHostUI();
        updateDescriberUI(players);
    });

    socket.on('emoji:roundStarted', ({ players }) => {
        renderPlayers(players, 'playerList2');
        syncMyState(players);
        updateHostUI();
        updateDescriberUI(players);
        clearClues();
        showScreen('playingScreen');
    });

    socket.on('emoji:describerChanged', ({ players }) => {
        renderPlayers(players, 'playerList2');
        syncMyState(players);
        hide('describerCard');
        hide('guesserCard');
        updateHostUI();
        updateDescriberUI(players);
        clearClues();
        showScreen('playingScreen');
    });

    socket.on('emoji:yourWord', word => {
        document.getElementById('secretWord').textContent = word;
        show('describerCard');
        hide('guesserCard');
    });

    socket.on('emoji:clueReceived', ({ clue, describerName }) => {
        addClue(clue);
    });

    socket.on('emoji:wordGuessed', ({ guesserName, word }) => {
        document.getElementById('endedBox').className = 'status-box status-success';
        document.getElementById('endedBox').innerHTML =
            `<span class="big-emoji">🎉</span><strong>${escapeHtml(guesserName)} guessed it!</strong>`;
        document.getElementById('revealWord').textContent = word;
        showScreen('endedScreen');
        updateHostUI();
    });

    socket.on('emoji:wordSkipped', ({ word }) => {
        document.getElementById('endedBox').className = 'status-box status-fail';
        document.getElementById('endedBox').innerHTML =
            '<span class="big-emoji">⏭</span><strong>Word skipped</strong>';
        document.getElementById('revealWord').textContent = word;
        showScreen('endedScreen');
        updateHostUI();
    });
}

// ─── Helpers ──────────────────────────────────────────────────────
/**
 * Emits an emoji:join event with the player's name from the name input field.
 *
 * @param {Object} socket - The Socket.IO client instance.
 */
function join(socket) {
    const name = document.getElementById('nameInput').value.trim() || 'Player';
    socket.emit('emoji:join', name);
}

/**
 * Reads the guess input, emits it to the server, and clears the input field.
 * Does nothing if the input is empty.
 *
 * @param {Object} socket - The Socket.IO client instance.
 */
function submitGuess(socket) {
    const guess = document.getElementById('guessInput').value.trim();
    if (guess) {
        socket.emit('emoji:submitGuess', guess);
        document.getElementById('guessInput').value = '';
    }
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
    toggle('hostControls',       state.isHost);
    toggle('hostRoundControls',  state.isHost);
    toggle('hostEndControls',    state.isHost);
    toggle('nonHostEndStatus',  !state.isHost);
}

/**
 * Updates the describer name label and shows the appropriate card (describer or guesser view)
 * depending on whether the local player is the current describer.
 *
 * @param {Array<Object>} players - The full player list from the server.
 */
function updateDescriberUI(players) {
    const desc = players.find(p => p.isDescriber);
    const nameEl = document.getElementById('describerName');
    if (nameEl && desc) nameEl.textContent = desc.name;

    if (!state.amDescriber) {
        hide('describerCard');
        show('guesserCard');
    }
}

/**
 * Appends a new emoji clue to the clue display and scrolls to the bottom.
 *
 * @param {string} clue - The emoji clue string sent by the describer.
 */
function addClue(clue) {
    const display = document.getElementById('emojiClues');
    const clueDiv = document.createElement('div');
    clueDiv.className = 'emoji-clue';
    clueDiv.textContent = clue;
    display.appendChild(clueDiv);
    display.scrollTop = display.scrollHeight;
}

/** Clears all displayed emoji clues and resets the guess input field. */
function clearClues() {
    document.getElementById('emojiClues').innerHTML = '';
    document.getElementById('guessInput').value = '';
}

// ─── Start ────────────────────────────────────────────────────────
init();