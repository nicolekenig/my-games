import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function openPlayer(browser, name) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/emoji-charades/index.html?player=${encodeURIComponent(name)}`);
    return { ctx, page };
}

async function joinGame(page, name) {
    await page.locator('#nameInput').fill(name);
    await page.locator('#btnJoin').click();
    await expect(page.locator('#joinScreen')).not.toHaveClass(/active/, { timeout: 5000 });
}

// Opens two players, joins, and starts a round.
// cleanup() skips the round and closes both contexts.
async function startRound(browser) {
    const { ctx: ctx1, page: host } = await openPlayer(browser, 'Alice');
    const { ctx: ctx2, page: guest } = await openPlayer(browser, 'Bob');
    await joinGame(host, 'Alice');
    await joinGame(guest, 'Bob');

    // If room was left mid-round, end it first
    if (!await host.locator('#lobbyScreen').evaluate(el => el.classList.contains('active'))) {
        try { await host.locator('#btnSkip').click(); } catch {}
        try { await host.locator('#btnNewRound').click(); } catch {}
    }
    await expect(host.locator('#lobbyScreen')).toHaveClass(/active/, { timeout: 3000 });

    await host.locator('#btnStart').click();
    await expect(host.locator('#playingScreen')).toHaveClass(/active/, { timeout: 5000 });
    await expect(guest.locator('#playingScreen')).toHaveClass(/active/, { timeout: 5000 });

    async function cleanup() {
        try {
            if (await host.locator('#playingScreen').evaluate(el => el.classList.contains('active'))) {
                await host.locator('#btnSkip').click();
            }
        } catch {}
        await ctx1.close();
        await ctx2.close();
    }

    return { host, guest, ctx1, ctx2, cleanup };
}

// ─── Join Screen ──────────────────────────────────────────────────

test.describe('Emoji Charades – Join Screen', () => {
    test('shows join screen on load', async ({ page }) => {
        await page.goto(`${BASE}/emoji-charades/index.html?player=Alice`);
        await expect(page.locator('#joinScreen')).toHaveClass(/active/);
    });

    test('pre-fills name from URL param', async ({ page }) => {
        await page.goto(`${BASE}/emoji-charades/index.html?player=Alice`);
        await expect(page.locator('#nameInput')).toHaveValue('Alice');
    });

    test('join button goes to lobby', async ({ page }) => {
        await page.goto(`${BASE}/emoji-charades/index.html?player=Alice`);
        await page.locator('#btnJoin').click();
        await expect(page.locator('#joinScreen')).not.toHaveClass(/active/, { timeout: 5000 });
    });

    test('Enter key joins the game', async ({ page }) => {
        await page.goto(`${BASE}/emoji-charades/index.html?player=Alice`);
        await page.locator('#nameInput').press('Enter');
        await expect(page.locator('#joinScreen')).not.toHaveClass(/active/, { timeout: 5000 });
    });

    test('back button links to home', async ({ page }) => {
        await page.goto(`${BASE}/emoji-charades/index.html`);
        await expect(page.locator('.back-btn')).toHaveAttribute('href', '/');
    });
});

// ─── Lobby Notifications ──────────────────────────────────────────

test.describe.serial('Emoji Charades – Lobby Notifications', () => {
    test('first player (host) sees start button and waiting status', async ({ browser }) => {
        const { ctx, page } = await openPlayer(browser, 'Alice');
        try {
            await joinGame(page, 'Alice');
            await expect(page.locator('#lobbyScreen')).toHaveClass(/active/);
            await expect(page.locator('#hostControls')).not.toHaveClass(/hidden/);
            await expect(page.locator('#btnStart')).toBeVisible();
            await expect(page.locator('#lobbyStatus')).toContainText('Waiting for the host');
        } finally {
            await ctx.close();
        }
    });

    test('second player does not see host controls', async ({ browser }) => {
        const { ctx: ctx1, page: page1 } = await openPlayer(browser, 'Alice');
        const { ctx: ctx2, page: page2 } = await openPlayer(browser, 'Bob');
        try {
            await joinGame(page1, 'Alice');
            await joinGame(page2, 'Bob');

            await expect(page2.locator('#hostControls')).toHaveClass(/hidden/);
            await expect(page1.locator('#playerList')).toContainText('Bob');
            await expect(page2.locator('#playerList')).toContainText('Alice');
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });
});

// ─── Playing Screen Notifications ─────────────────────────────────

test.describe.serial('Emoji Charades – Playing Screen Notifications', () => {
    test('round starts and both players see playing screen', async ({ browser }) => {
        const { cleanup, ...players } = await startRound(browser);
        try {
            await expect(players.host.locator('#playingScreen')).toHaveClass(/active/);
            await expect(players.guest.locator('#playingScreen')).toHaveClass(/active/);
        } finally {
            await cleanup();
        }
    });

    test('describer sees secret word card with emoji input', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#describerCard').evaluate(el => !el.classList.contains('hidden'));
            const describer = hostIsDescriber ? host : guest;

            await expect(describer.locator('#describerCard')).toBeVisible();
            await expect(describer.locator('#secretWord')).not.toBeEmpty();
            await expect(describer.locator('#emojiInput')).toBeVisible();
            await expect(describer.locator('#btnSendEmoji')).toBeVisible();
        } finally {
            await cleanup();
        }
    });

    test('guesser sees clue area and guess input', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#describerCard').evaluate(el => !el.classList.contains('hidden'));
            const guesser = hostIsDescriber ? guest : host;

            await expect(guesser.locator('#guesserCard')).toBeVisible();
            await expect(guesser.locator('#guessInput')).toBeVisible();
            await expect(guesser.locator('#btnSubmitGuess')).toBeVisible();
        } finally {
            await cleanup();
        }
    });

    test('describer sends emoji clue → guesser receives it', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#describerCard').evaluate(el => !el.classList.contains('hidden'));
            const [describer, guesser] = hostIsDescriber ? [host, guest] : [guest, host];

            await describer.locator('#emojiInput').fill('🎬🎥');
            await describer.locator('#btnSendEmoji').click();

            await expect(guesser.locator('#emojiClues')).toContainText('🎬🎥', { timeout: 5000 });
            await expect(describer.locator('#emojiInput')).toHaveValue('');
        } finally {
            await cleanup();
        }
    });

    test('host sees skip and next-describer controls; guest does not', async ({ browser }) => {
        const { host, guest, cleanup } = await startRound(browser);
        try {
            await expect(host.locator('#hostRoundControls')).not.toHaveClass(/hidden/);
            await expect(host.locator('#btnSkip')).toBeVisible();
            await expect(host.locator('#btnNextDescriber')).toBeVisible();
            await expect(guest.locator('#hostRoundControls')).toHaveClass(/hidden/);
        } finally {
            await cleanup();
        }
    });

    test('guesser submits correct answer → word guessed notification', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#describerCard').evaluate(el => !el.classList.contains('hidden'));
            const guesser = hostIsDescriber ? guest : host;
            const secretWord = hostIsDescriber
                ? await host.locator('#secretWord').textContent()
                : await guest.locator('#secretWord').textContent();

            await guesser.locator('#guessInput').fill(secretWord.trim());
            await guesser.locator('#btnSubmitGuess').click();

            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(host.locator('#endedBox')).toHaveClass(/status-success/);
            await expect(host.locator('#endedBox')).toContainText('guessed it');
            await expect(host.locator('#revealWord')).toContainText(secretWord.trim());
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('Enter key submits guess', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            const hostIsDescriber = await host.locator('#describerCard').evaluate(el => !el.classList.contains('hidden'));
            const guesser = hostIsDescriber ? guest : host;
            const secretWord = hostIsDescriber
                ? await host.locator('#secretWord').textContent()
                : await guest.locator('#secretWord').textContent();

            await guesser.locator('#guessInput').fill(secretWord.trim());
            await guesser.locator('#guessInput').press('Enter');

            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('host skips word → skipped notification shown', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await startRound(browser);
        try {
            await host.locator('#btnSkip').click();

            await expect(host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(host.locator('#endedBox')).toHaveClass(/status-fail/);
            await expect(host.locator('#endedBox')).toContainText('skipped');
            await expect(host.locator('#revealWord')).not.toBeEmpty();
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });
});

// ─── End Screen Notifications ─────────────────────────────────────

test.describe.serial('Emoji Charades – End Screen Notifications', () => {
    async function reachEndScreen(browser) {
        const round = await startRound(browser);
        await round.host.locator('#btnSkip').click();
        await expect(round.host.locator('#endedScreen')).toHaveClass(/active/, { timeout: 5000 });
        return round;
    }

    test('host sees new round controls on end screen', async ({ browser }) => {
        const { host, ctx1, ctx2 } = await reachEndScreen(browser);
        try {
            await expect(host.locator('#hostEndControls')).not.toHaveClass(/hidden/);
            await expect(host.locator('#btnNewRound')).toBeVisible();
            await expect(host.locator('#btnNewRoundNext')).toBeVisible();
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('non-host sees waiting notification on end screen', async ({ browser }) => {
        const { guest, ctx1, ctx2 } = await reachEndScreen(browser);
        try {
            await expect(guest.locator('#nonHostEndStatus')).toBeVisible();
            await expect(guest.locator('#nonHostEndStatus')).toContainText('Waiting for host');
            await expect(guest.locator('#hostEndControls')).toHaveClass(/hidden/);
        } finally {
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('"New Round" restarts from end screen', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await reachEndScreen(browser);
        try {
            await host.locator('#btnNewRound').click();
            await expect(host.locator('#playingScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#playingScreen')).toHaveClass(/active/, { timeout: 5000 });
        } finally {
            try { await host.locator('#btnSkip').click(); } catch {}
            await ctx1.close();
            await ctx2.close();
        }
    });

    test('"New Round + Next Describer" cycles to next describer', async ({ browser }) => {
        const { host, guest, ctx1, ctx2 } = await reachEndScreen(browser);
        try {
            await host.locator('#btnNewRoundNext').click();
            await expect(host.locator('#playingScreen')).toHaveClass(/active/, { timeout: 5000 });
            await expect(guest.locator('#playingScreen')).toHaveClass(/active/, { timeout: 5000 });
        } finally {
            try { await host.locator('#btnSkip').click(); } catch {}
            await ctx1.close();
            await ctx2.close();
        }
    });
});
