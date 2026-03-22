const { escapeHtml, nameToColor } = require('../shared/utils');

// ─── escapeHtml ───────────────────────────────────────────────────
describe('escapeHtml', () => {
    test('escapes ampersands', () => {
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    test('escapes < and >', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    test('escapes double quotes', () => {
        expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    test('escapes single quotes', () => {
        expect(escapeHtml("it's")).toBe('it&#039;s');
    });

    test('leaves safe strings unchanged', () => {
        expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });

    test('converts non-strings to string first', () => {
        expect(escapeHtml(42)).toBe('42');
        expect(escapeHtml(null)).toBe('null');
    });

    test('handles empty string', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('blocks XSS injection patterns', () => {
        const xss = '<img src=x onerror="alert(1)">';
        const escaped = escapeHtml(xss);
        expect(escaped).not.toContain('<');
        expect(escaped).not.toContain('>');
        expect(escaped).not.toContain('"');
    });

    test('escapes all special chars in one string', () => {
        expect(escapeHtml('<a href="x">&\'</a>')).toBe(
            '&lt;a href=&quot;x&quot;&gt;&amp;&#039;&lt;/a&gt;'
        );
    });
});

// ─── nameToColor ──────────────────────────────────────────────────
describe('nameToColor', () => {
    const PALETTE = ['#7c6ff7', '#ff3b5c', '#ff8c42', '#22c55e', '#38bdf8', '#fb923c', '#a3e635'];

    test('returns a color from the palette', () => {
        expect(PALETTE).toContain(nameToColor('Alice'));
    });

    test('returns the same color for the same name every time', () => {
        expect(nameToColor('Alice')).toBe(nameToColor('Alice'));
        expect(nameToColor('Bob')).toBe(nameToColor('Bob'));
    });

    test('handles empty string without throwing', () => {
        expect(PALETTE).toContain(nameToColor(''));
    });

    test('different names produce more than one distinct color', () => {
        const names = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi'];
        const colors = new Set(names.map(nameToColor));
        expect(colors.size).toBeGreaterThan(1);
    });

    test('every output is a valid hex color string', () => {
        ['Alice', 'Bob', 'X', '123', 'אבג'].forEach(name => {
            expect(nameToColor(name)).toMatch(/^#[0-9a-f]{6}$/);
        });
    });
});
