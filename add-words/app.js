// ─── Screen helpers ───────────────────────────────────────────────
const gameSelectScreen = document.getElementById('gameSelectScreen');
const addWordScreen    = document.getElementById('addWordScreen');

/**
 * Switches the active screen by removing 'active' from all screens and adding it to the target.
 *
 * @param {string} id - The ID of the screen element to activate.
 */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ─── Game select ──────────────────────────────────────────────────
const GAME_CONFIG = {
    forbidden: {
        icon: '🚫',
        title: 'Forbidden Word',
        subtitle: 'Add a new card with 5 forbidden clue words',
        form: 'forbiddenForm',
    },
    emoji: {
        icon: '😀',
        title: 'Emoji Charades',
        subtitle: 'Add a new word or phrase to guess',
        form: 'emojiForm',
    },
    forehead: {
        icon: '🎭',
        title: 'Forehead',
        subtitle: 'Add a new celebrity or character name',
        form: 'foreheadForm',
    },
};

let currentGame = null;

document.querySelectorAll('.game-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentGame = btn.dataset.game;
        const cfg = GAME_CONFIG[currentGame];

        document.getElementById('addIcon').textContent    = cfg.icon;
        document.getElementById('addTitle').textContent   = cfg.title;
        document.getElementById('addSubtitle').textContent = cfg.subtitle;

        // Show the right form
        document.querySelectorAll('.add-form').forEach(f => f.classList.add('hidden'));
        document.getElementById(cfg.form).classList.remove('hidden');

        clearFeedback();
        showScreen('addWordScreen');
    });
});

// ─── Back button ──────────────────────────────────────────────────
document.getElementById('btnBack').addEventListener('click', () => {
    clearFeedback();
    resetForms();
    showScreen('gameSelectScreen');
});

// ─── Feedback helpers ─────────────────────────────────────────────
/**
 * Displays a feedback message with the given style type.
 *
 * @param {string} msg - The message text to display.
 * @param {string} type - The CSS modifier class (e.g. 'success' or 'error').
 */
function showFeedback(msg, type) {
    const el = document.getElementById('feedback');
    el.textContent = msg;
    el.className = 'feedback ' + type;
}
/** Hides the feedback element and clears its text. */
function clearFeedback() {
    const el = document.getElementById('feedback');
    el.className = 'feedback hidden';
    el.textContent = '';
}

/** Clears all input fields across every add-word form. */
function resetForms() {
    document.querySelectorAll('.add-form input').forEach(i => i.value = '');
}

// ─── API call ─────────────────────────────────────────────────────
const ADMIN_TOKEN = window.ADMIN_TOKEN || 'change-me';

/**
 * Posts a JSON payload to the given API endpoint with admin authentication.
 *
 * @param {string} endpoint - The API URL to POST to.
 * @param {Object} body - The request payload to send as JSON.
 * @returns {Promise<{ok: boolean, status: number, data: Object}>} The response status and parsed JSON body.
 */
async function postWord(endpoint, body) {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-token': ADMIN_TOKEN,
        },
        body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
}

// ─── Forbidden Word form ──────────────────────────────────────────
document.getElementById('forbiddenForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearFeedback();

    const word     = document.getElementById('fw-word').value.trim();
    const forbidden = Array.from(document.querySelectorAll('.fw-forbidden'))
                          .map(i => i.value.trim())
                          .filter(Boolean);

    if (!word) { showFeedback('Please enter the word to guess.', 'error'); return; }
    if (forbidden.length !== 5) { showFeedback('Please fill in all 5 forbidden words.', 'error'); return; }

    const { ok, status, data } = await postWord('/api/words/forbidden', { word, forbidden });

    if (ok) {
        showFeedback(`"${word.toUpperCase()}" added to Forbidden Word!`, 'success');
        document.getElementById('forbiddenForm').reset();
    } else if (status === 409) {
        showFeedback(data.error, 'error');
    } else {
        showFeedback('Something went wrong. Please try again.', 'error');
    }
});

// ─── Emoji Charades form ──────────────────────────────────────────
document.getElementById('emojiForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearFeedback();

    const word = document.getElementById('emoji-word').value.trim();
    if (!word) { showFeedback('Please enter a word or phrase.', 'error'); return; }

    const { ok, status, data } = await postWord('/api/words/emoji', { word });

    if (ok) {
        showFeedback(`"${word.toUpperCase()}" added to Emoji Charades!`, 'success');
        document.getElementById('emojiForm').reset();
    } else if (status === 409) {
        showFeedback(data.error, 'error');
    } else {
        showFeedback('Something went wrong. Please try again.', 'error');
    }
});

// ─── Forehead form ────────────────────────────────────────────────
document.getElementById('foreheadForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearFeedback();

    const name = document.getElementById('forehead-char').value.trim();
    if (!name) { showFeedback('Please enter a name.', 'error'); return; }

    const { ok, status, data } = await postWord('/api/words/forehead', { word: name });

    if (ok) {
        // Also save to localStorage so the Forehead game picks it up
        const key = 'customForeheadChars';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.some(c => c.toLowerCase() === name.toLowerCase())) {
            existing.push(name);
            localStorage.setItem(key, JSON.stringify(existing));
        }
        showFeedback(`"${name}" added to Forehead!`, 'success');
        document.getElementById('foreheadForm').reset();
    } else if (status === 409) {
        showFeedback(data.error, 'error');
    } else {
        showFeedback('Something went wrong. Please try again.', 'error');
    }
});
