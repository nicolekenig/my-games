// ── shared/utils.js ── Shared helpers for all games ──

// Score display
function showScore(elementId, score) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = score;
}

// Simple keyboard map helper
function onKey(keys, callback) {
    document.addEventListener('keydown', e => {
        if (keys.includes(e.key)) callback(e.key);
    });
}

// Get player name from URL params
function getPlayerName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('player') || localStorage.getItem('playerName') || 'Player';
}

// Escape HTML for safe display
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Generate color from name (for avatars)
function nameToColor(name) {
    const palette = ['#7c6ff7','#ff3b5c','#ff8c42','#22c55e','#38bdf8','#fb923c','#a3e635'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
}