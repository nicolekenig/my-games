// ─── Config ───────────────────────────────────────────────────────
const CHARACTERS = [
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
    'Gal Gadot', 'Bar Refaeli', 'Omer Adam', 'Netta Barzilai', 'Lior Raz',
    'Rotem Sela', 'Yael Shelbia', 'Noa Kirel', 'Eyal Golan', 'Moshe Peretz',
    'Idan Raichel', 'Keren Peles', 'Sarit Hadad', 'Ivri Lider', 'Shlomo Artzi',
    'Kobi Peretz', 'Anna Zak', 'Nasrin Kadri', 'Lucy Ayoub', 'Shira Haas',

    // Sports & Other
    'Lionel Messi', 'Cristiano Ronaldo', 'LeBron James', 'Serena Williams',
    'Elon Musk', 'Mark Zuckerberg', 'Oprah Winfrey', 'Barack Obama'
];

// ─── State ────────────────────────────────────────────────────────
let state = {
    timeLeft: 60,        // seconds
    isRunning: false,
    currentChar: '',
    correctCount: 0,
    passedCount: 0,
    usedCharacters: [],
    interval: null,
    roundCount: 1        // rounds spent on current character
};

// ─── Merge custom characters from localStorage ────────────────────
/** Merges any custom character names saved in localStorage into the CHARACTERS pool. */
(function mergeCustomChars() {
    try {
        const custom = JSON.parse(localStorage.getItem('customForeheadChars') || '[]');
        custom.forEach(name => {
            if (name && !CHARACTERS.some(c => c.toLowerCase() === name.toLowerCase())) {
                CHARACTERS.push(name);
            }
        });
    } catch (e) { /* ignore */ }
})();

// ─── Init ─────────────────────────────────────────────────────────
/**
 * Initializes the game by wiring up button listeners and picking the first character.
 */
function init() {
    // Button listeners
    document.getElementById('btnStartPause').addEventListener('click', toggleTimer);
    document.getElementById('btnReset').addEventListener('click', resetTimer);
    document.getElementById('btnNewChar').addEventListener('click', newCharacter);
    document.getElementById('btnPass').addEventListener('click', passCharacter);
    document.getElementById('btnCorrect').addEventListener('click', correctAnswer);

    // Pick first character (but don't start timer)
    newCharacter();
}

// ─── Timer ────────────────────────────────────────────────────────
/**
 * Toggles the timer between running and paused states.
 */
function toggleTimer() {
    if (state.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

/**
 * Starts the countdown timer and updates the button to show a pause option.
 */
function startTimer() {
    state.isRunning = true;
    document.getElementById('btnStartPause').textContent = '⏸ Pause';
    document.getElementById('btnStartPause').classList.remove('btn-primary');
    document.getElementById('btnStartPause').classList.add('btn-secondary');

    state.interval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            // Time's up — give them another round with the same character
            state.roundCount++;
            updateRoundDisplay();
            state.timeLeft = 60;
            updateTimerDisplay();
        }
    }, 1000);
}

/**
 * Pauses the countdown timer and resets the button to show a start option.
 */
function pauseTimer() {
    state.isRunning = false;
    document.getElementById('btnStartPause').textContent = '▶ Start';
    document.getElementById('btnStartPause').classList.remove('btn-secondary');
    document.getElementById('btnStartPause').classList.add('btn-primary');

    if (state.interval) {
        clearInterval(state.interval);
        state.interval = null;
    }
}

/** Resets the timer to 60 seconds without stopping or starting it. */
function resetTimer() {
    state.timeLeft = 60;
    updateTimerDisplay();
}

/** Updates the round badge text and highlights it when the current character has used more than one round. */
function updateRoundDisplay() {
    const badge = document.getElementById('roundBadge');
    badge.textContent = `Round ${state.roundCount}`;
    badge.classList.toggle('multi-round', state.roundCount > 1);
}

/** Updates the timer display with the current time and changes its color based on urgency. */
function updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    const display = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;

    // Change color based on time remaining
    const timerEl = document.getElementById('timerDisplay');
    if (state.timeLeft <= 10) {
        timerEl.style.color = '#e05555';
    } else if (state.timeLeft <= 30) {
        timerEl.style.color = '#ff8c42';
    } else {
        timerEl.style.color = '#f0f0f0';
    }
}

// ─── Character ────────────────────────────────────────────────────
/**
 * Picks a random unused character from the pool and displays it, resetting the round counter.
 * Resets the used pool if all characters have been shown.
 */
function newCharacter() {
    // If all characters used, reset pool
    if (state.usedCharacters.length >= CHARACTERS.length) {
        state.usedCharacters = [];
    }

    // Pick random unused character
    let available = CHARACTERS.filter(c => !state.usedCharacters.includes(c));
    const randomChar = available[Math.floor(Math.random() * available.length)];

    state.currentChar = randomChar;
    state.usedCharacters.push(randomChar);

    // Reset round counter for new character
    state.roundCount = 1;
    updateRoundDisplay();

    document.getElementById('characterName').textContent = randomChar;
}

// ─── Actions ──────────────────────────────────────────────────────
/** Increments the pass count and advances to the next character. */
function passCharacter() {
    state.passedCount++;
    document.getElementById('passedCount').textContent = state.passedCount;
    newCharacter();
}

/** Increments the correct count, resets the timer to 60 seconds, and advances to the next character. */
function correctAnswer() {
    state.correctCount++;
    document.getElementById('correctCount').textContent = state.correctCount;

    // Reset timer to 1:00
    state.timeLeft = 60;
    updateTimerDisplay();

    // New character (also resets round counter)
    newCharacter();
}

// ─── Start ────────────────────────────────────────────────────────
init();