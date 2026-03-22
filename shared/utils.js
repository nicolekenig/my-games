// ── shared/utils.js ── Shared helpers for all games ──

// Get player name from URL params or localStorage
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

if (typeof module !== 'undefined') {
    module.exports = { escapeHtml, nameToColor, getPlayerName };
}
