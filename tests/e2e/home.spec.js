import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('playerName'));
        await page.reload();
    });

    test('displays header and game cards', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('My Games');
        await expect(page.locator('.subtitle')).toBeVisible();

        const cards = page.locator('.game-card');
        await expect(cards).toHaveCount(3);
        await expect(cards.nth(0)).toContainText('Forbidden Word');
        await expect(cards.nth(1)).toContainText('Emoji Charades');
        await expect(cards.nth(2)).toContainText('Forehead');
    });

    test('player name input shows greeting', async ({ page }) => {
        const input = page.locator('#player-input');
        const greeting = page.locator('#greeting');

        // Greeting uses opacity:0/1 via .visible class — test the class, not Playwright visibility
        await expect(greeting).not.toHaveClass(/visible/);

        await input.pressSequentially('Alice');
        await expect(greeting).toHaveClass(/visible/);
        await expect(greeting).toContainText('Hey, Alice');
    });

    test('player name is saved to localStorage', async ({ page }) => {
        await page.locator('#player-input').pressSequentially('Alice');
        const saved = await page.evaluate(() => localStorage.getItem('playerName'));
        expect(saved).toBe('Alice');
    });

    test('player name is restored from localStorage on reload', async ({ page }) => {
        await page.evaluate(() => localStorage.setItem('playerName', 'Bob'));
        await page.reload();
        await expect(page.locator('#player-input')).toHaveValue('Bob');
        await expect(page.locator('#greeting')).toHaveClass(/visible/);
        await expect(page.locator('#greeting')).toContainText('Hey, Bob');
    });

    test('clearing player name hides greeting', async ({ page }) => {
        const input = page.locator('#player-input');
        await input.pressSequentially('Alice');
        await expect(page.locator('#greeting')).toHaveClass(/visible/);

        await input.selectText();
        await input.press('Backspace');
        await expect(page.locator('#greeting')).not.toHaveClass(/visible/);
    });

    test('navigates to Forehead without server check', async ({ page }) => {
        await page.locator('#player-input').fill('Alice');
        await page.locator('.game-card').nth(2).click();
        await expect(page).toHaveURL(/forehead/);
    });

    test('navigates to Forehead with player name in URL', async ({ page }) => {
        await page.locator('#player-input').fill('Alice');
        await page.locator('.game-card').nth(2).click();
        await expect(page).toHaveURL(/player=Alice/);
    });

    test('navigates to Forehead with default name when input is empty', async ({ page }) => {
        await page.locator('.game-card').nth(2).click();
        await expect(page).toHaveURL(/player=Player/);
    });

    test('navigates to Forbidden Word when server is running', async ({ page }) => {
        await page.locator('#player-input').fill('Alice');
        await page.locator('.game-card').nth(0).click();
        await expect(page).toHaveURL(/forbidden-word/);
        await expect(page).toHaveURL(/player=Alice/);
    });

    test('navigates to Emoji Charades when server is running', async ({ page }) => {
        await page.locator('#player-input').fill('Alice');
        await page.locator('.game-card').nth(1).click();
        await expect(page).toHaveURL(/emoji-charades/);
        await expect(page).toHaveURL(/player=Alice/);
    });

    test('each game card shows a Play button', async ({ page }) => {
        await expect(page.locator('.play-btn')).toHaveCount(3);
    });
});
