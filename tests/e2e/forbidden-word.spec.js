import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Opens an isolated browser context for one player
async function openPlayer(browser, name) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/forbidden-word/index.html?player=${encodeURIComponent(name)}`);
    return { ctx, page };
}

// Joins the game room. Waits for any screen other than joinScreen to become active.
// The room may already be in a mid-round state from a prior test; game.js will
// redirect to describingScreen in that case, but joinScreen still deactivates.
async function joinGame(page, name) {
    await page.locator('#nameInput').fill(name);
    await page.locator('#btnJoin').click();
    await expect(page.locator('#joinScreen')).not.toHaveClass(/active/, { timeout: 5000 });
}

// Brings two players into an active describing round.
// Returns { host, guest, ctx1, ctx2, cleanup }.
// cleanup() ends the round and closes both contexts.
async function startRound(browser) {
    const { ctx: ctx1, page: host } = await openPlayer(browser, 'Alice');
    const { ctx: ctx2, page: guest } = await openPlayer(browser, 'Bob');
    await joinGame(host, 'Alice');
    await joinGame(guest, 'Bob');

    // If the room was left in describing phase, end it first
    if (!await host.locator('#lobbyScreen').evaluate(el => el.classList.contains('active'))) {
        try { await host.locator('#btnGuessed').click(); } catch {}
        await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 3000 });
        await host.locator('#btnNewRound').click();
    }
    await expect(host.locator('#lobbyScreen')).toHaveClass(/active/, { timeout: 3000 });

    await host.locator('#btnStart').click();
    await expect(host.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
    await expect(guest.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });

    async function cleanup() {
        try {
            if (await host.locator('#describingScreen').evaluate(el => el.classList.contains('active'))) {
                await host.locator('#btnGuessed').click();
            }
        } catch {}
        await ctx1.close();
        await ctx2.close();
    }

    return { host, guest, ctx1, ctx2, cleanup };
}

// ─── Join Screen ──────────────────────────────────────────────────

test.describe('Forbidden Word – Join Screen', () => {
    test('shows join screen on load', async ({ page }) => {
        await page.goto(`${BASE}/forbidden-word/index.html?player=Alice`);
        await expect(page.locator('#joinScreen')).toHaveClass(/active/);
        await expect(page.locator('#lobbyScreen')).not.toHaveClass(/active/);
    });

    test('pre-fills name from URL query param', async ({ page }) => {
        await page.goto(`${BASE}/forbidden-word/index.html?player=Alice`);
        await expect(page.locator('#nameInput')).toHaveValue('Alice');
    });

    test('join button navigates away from join screen', async ({ page }) => {
        await page.goto(`${BASE}/forbidden-word/index.html?player=Alice`);
        await page.locator('#btnJoin').click();
        await expect(page.locator('#joinScreen')).not.toHaveClass(/active/, { timeout: 5000 });
    });

    test('Enter key in name input joins the game', async ({ page }) => {
        await page.goto(`${BASE}/forbidden-word/index.html?player=Alice`);
        await page.locator('#nameInput').press('Enter');
        await expect(page.locator('#joinScreen')).not.toHaveClass(/active/, { timeout: 5000 });
    });

    test('back button links to home', async ({ page }) => {
        await page.goto(`${BASE}/forbidden-word/index.html`);
        await expect(page.locator('.back-btn')).toHaveAttribute('href', '/');
    });
});

// ─── Lobby Notifications ──────────────────────────────────────────

test.describe.serial('Forbidden Word – Lobby Notifications', () => {
    test('first player becomes host and sees host controls', async ({ browser }) => {
        const { ctx, page } = await openPlayer(browser, 'Alice');
        try {
            await joinGame(page, 'Alice');
            await expect(page.locator('#lobbyScreen')).toHaveClass(/active/);
            await expect(page.locator('#hostControls')).not.toHaveClass(/hidden/);
            await expect(page.locator('#btnStart')).toBeVisible();
            await expect(page.locator('#btnNextStart')).toBeVisible();
            await expect(page.locator('#lobbyStatus')).toContainText('Waiting for the host');
        } finally {
            await ctx.close();
        }
    });

    test('second player sees player list and waiting notification', async ({ browser }) => {
        const { ctx: ctx1, page: page1 } = await openPlayer(browser, 'Alice');
        const { ctx: ctx2, page: page2 } = await openPlayer(browser, 'Bob');
        try {
            await joinGame(page1, 'Alice');
            await joinGame(page2, 'Bob');

            // Non-host hides host controls
            await expect(page2.locator('#hostControls')).toHaveClass(/hidden/);

            // Both names appear in the lobby list
            await expect(page1.locator('#playerList')).toContainText('Alice');
            await expect(page1.locator('#playerList')).toContainText('Bob');
            await expect(page2.locator('#playerList')).toContainText('Alice');
            await expect(page2.locator('#playerList')).toContainText('Bob');

            // Host badge shown (scope to #playerList to avoid strict-mode error from #playerList2)
            await expect(page1.locator('#playerList .badge-host').first()).toBeVisible();
            await expect(page2.locator('#playerList .badge-host').first()).toBeVisible();

            // "You" badge for each player
            await expect(page2.locator('#playerList .badge-you').first()).toBeVisible();
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });
});

// ─── Describing Screen Notifications ──────────────────────────────

test.describe.serial('Forbidden Word – Describing Screen Notifications', () => {
    test('host starts round → all players see describing screen', async ({ browser }) => {
        const { cleanup, ...players } = await startRound(browser);
        try {
            await expect(players.host.locator('#describingScreen')).toHaveClass(/active/);
            await expect(players.guest.locator('#describingScreen')).toHaveClass(/active/);
        } finally {
            await cleanup();
        }
    });

    test('describer sees card with word and 5 forbidden tags', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#myCard').evaluate(el => !el.classList.contains('hidden'));
            const describer = hostIsDescriber ? host : guest;

            await expect(describer.locator('#myCard')).toBeVisible();
            await expect(describer.locator('#cardWord')).not.toBeEmpty();
            await expect(describer.locator('.forbidden-tag')).toHaveCount(5);
            await expect(describer.locator('#btnForbidden')).toBeVisible();
        } finally {
            await cleanup();
        }
    });

    test('guesser sees "is describing" status notification', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#myCard').evaluate(el => !el.classList.contains('hidden'));
            const guesser = hostIsDescriber ? guest : host;

            await expect(guesser.locator('#guessStatus')).toBeVisible();
            await expect(guesser.locator('#describerName')).not.toBeEmpty();
        } finally {
            await cleanup();
        }
    });

    test('host sees round control buttons; guest does not', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            await expect(host.locator('#hostRoundControls')).not.toHaveClass(/hidden/);
            await expect(host.locator('#btnGuessed')).toBeVisible();
            await expect(host.locator('#btnNext')).toBeVisible();
            await expect(guest.locator('#hostRoundControls')).toHaveClass(/hidden/);
        } finally {
            await cleanup();
        }
    });
});

// ─── Round End Notifications ──────────────────────────────────────

test.describe.serial('Forbidden Word – Round End Notifications', () => {
    test('"Word Guessed" shows success notification to all players', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            await host.locator('#btnGuessed').click();

            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });

            await expect(host.locator('#endedBox')).toHaveClass(/status-success/);
            await expect(host.locator('#endedBox')).toContainText('Word guessed');
            await expect(guest.locator('#endedBox')).toHaveClass(/status-success/);

            await expect(host.locator('#revealCard')).not.toHaveClass(/hidden/);
            await expect(host.locator('#revealWord')).not.toBeEmpty();
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('forbidden word spoken shows fail notification to all players', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#myCard').evaluate(el => !el.classList.contains('hidden'));
            const describer = hostIsDescriber ? host : guest;

            await describer.locator('#btnForbidden').click();

            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });

            await expect(host.locator('#endedBox')).toHaveClass(/status-fail/);
            await expect(host.locator('#endedBox')).toContainText('Forbidden word');
            await expect(guest.locator('#endedBox')).toHaveClass(/status-fail/);
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('host sees end controls; non-host sees waiting notification', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            await host.locator('#btnGuessed').click();
            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });

            await expect(host.locator('#hostEndControls')).not.toHaveClass(/hidden/);
            await expect(host.locator('#btnNewRound')).toBeVisible();
            await expect(host.locator('#btnNewRoundNext')).toBeVisible();

            await expect(guest.locator('#nonHostEndStatus')).toBeVisible();
            await expect(guest.locator('#nonHostEndStatus')).toContainText('Waiting for host');
            await expect(guest.locator('#hostEndControls')).toHaveClass(/hidden/);
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('"New Round" starts another round from end screen', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            await host.locator('#btnGuessed').click();
            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });

            await host.locator('#btnNewRound').click();
            await expect(host.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
        } finally {
            try { await host.locator('#btnGuessed').click(); } catch {}
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('"New Round + Next Describer" advances the describer', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            await host.locator('#btnGuessed').click();
            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });

            await host.locator('#btnNewRoundNext').click();
            await expect(host.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
        } finally {
            try { await host.locator('#btnGuessed').click(); } catch {}
            await ctx1.close();
            await ctx2.close();
        }
    });
});

// ─── Next Player's Turn (Lobby) ───────────────────────────────────

test.describe.serial('Forbidden Word – Next Player\'s Turn', () => {
    test('"Next Player\'s Turn" in lobby starts round with next describer', async ({ browser }) => {
        const { ctx: ctx1, page: host } = await openPlayer(browser, 'Alice');
        const { ctx: ctx2, page: guest } = await openPlayer(browser, 'Bob');
        try {
            await joinGame(host, 'Alice');
            await joinGame(guest, 'Bob');
            await expect(host.locator('#lobbyScreen')).toHaveClass(/active/);

            await host.locator('#btnNextStart').click();

            await expect(host.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#describingScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(host.locator('#playerList2 .badge-describer').first()).toBeVisible();
        } finally {
            try { await host.locator('#btnGuessed').click(); } catch {}
            await ctx1.close();
            await ctx2.close();
        }
    });
});
