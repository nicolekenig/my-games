// ── shared/utils.js ── Shared helpers for all games ──

/**
 * Gets the player's name from URL query params, localStorage, or falls back to 'Player'.
 *
 * @returns {string} The player's name.
 */
function getPlayerName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('player') || localStorage.getItem('playerName') || 'Player';
}

/**
 * Escapes HTML special characters in a string to prevent XSS when inserting into the DOM.
 *
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Deterministically maps a player name to a color from the avatar palette.
 *
 * @param {string} name - The player's name.
 * @returns {string} A hex color string.
 */
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
