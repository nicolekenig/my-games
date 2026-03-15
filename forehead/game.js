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
    interval: null
};

// ─── Init ─────────────────────────────────────────────────────────
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
function toggleTimer() {
    if (state.isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    state.isRunning = true;
    document.getElementById('btnStartPause').textContent = '⏸ Pause';
    document.getElementById('btnStartPause').classList.remove('btn-primary');
    document.getElementById('btnStartPause').classList.add('btn-secondary');

    state.interval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();

        if (state.timeLeft <= 0) {
            state.timeLeft = 60;
            updateTimerDisplay();
        }
    }, 1000);
}

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

function resetTimer() {
    state.timeLeft = 60;
    updateTimerDisplay();
}

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

    document.getElementById('characterName').textContent = randomChar;
}

// ─── Actions ──────────────────────────────────────────────────────
function passCharacter() {
    state.passedCount++;
    document.getElementById('passedCount').textContent = state.passedCount;
    newCharacter();
}

function correctAnswer() {
    state.correctCount++;
    document.getElementById('correctCount').textContent = state.correctCount;

    // Reset timer to 1:00
    state.timeLeft = 60;
    updateTimerDisplay();

    // New character
    newCharacter();
}

// ─── Start ────────────────────────────────────────────────────────
init();