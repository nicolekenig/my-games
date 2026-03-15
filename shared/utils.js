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