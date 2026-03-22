const { FORBIDDEN_CARDS, EMOJI_WORDS } = require('../server');

// ─── FORBIDDEN_CARDS ──────────────────────────────────────────────
describe('FORBIDDEN_CARDS', () => {
    test('has at least 10 cards', () => {
        expect(FORBIDDEN_CARDS.length).toBeGreaterThanOrEqual(10);
    });

    test('every card has a non-empty word string', () => {
        FORBIDDEN_CARDS.forEach((card, i) => {
            expect(typeof card.word).toBe('string');
            expect(card.word.length).toBeGreaterThan(0);
        });
    });

    test('every card has exactly 5 forbidden words', () => {
        FORBIDDEN_CARDS.forEach(card => {
            expect(Array.isArray(card.forbidden)).toBe(true);
            expect(card.forbidden).toHaveLength(5);
        });
    });

    test('every forbidden word is a non-empty string', () => {
        FORBIDDEN_CARDS.forEach(card => {
            card.forbidden.forEach(word => {
                expect(typeof word).toBe('string');
                expect(word.length).toBeGreaterThan(0);
            });
        });
    });

    test('no duplicate main words', () => {
        const words = FORBIDDEN_CARDS.map(c => c.word.toUpperCase());
        expect(new Set(words).size).toBe(words.length);
    });

    test('main word is not in its own forbidden list', () => {
        FORBIDDEN_CARDS.forEach(card => {
            const word = card.word.toLowerCase();
            const forbidden = card.forbidden.map(f => f.toLowerCase());
            expect(forbidden).not.toContain(word);
        });
    });
});

// ─── EMOJI_WORDS ──────────────────────────────────────────────────
describe('EMOJI_WORDS', () => {
    test('has at least 10 words', () => {
        expect(EMOJI_WORDS.length).toBeGreaterThanOrEqual(10);
    });

    test('all entries are non-empty strings', () => {
        EMOJI_WORDS.forEach(word => {
            expect(typeof word).toBe('string');
            expect(word.length).toBeGreaterThan(0);
        });
    });

    test('no duplicate words (case-insensitive)', () => {
        const upper = EMOJI_WORDS.map(w => w.toUpperCase());
        expect(new Set(upper).size).toBe(upper.length);
    });
});
