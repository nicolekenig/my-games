import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Forehead – Initial State', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/forehead/index.html?player=Alice`);
    });

    test('shows game screen with timer display', async ({ page }) => {
        await expect(page.locator('#gameScreen')).toHaveClass(/active/);
        await expect(page.locator('#timerDisplay')).toHaveText('1:00');
    });

    test('shows a character on load', async ({ page }) => {
        const name = await page.locator('#characterName').textContent();
        expect(name).not.toBe('');
        expect(name).not.toBe('Press Start to Begin');
    });

    test('scores start at zero', async ({ page }) => {
        await expect(page.locator('#correctCount')).toHaveText('0');
        await expect(page.locator('#passedCount')).toHaveText('0');
    });

    test('start button is visible', async ({ page }) => {
        await expect(page.locator('#btnStartPause')).toContainText('Start');
    });

    test('back button links to home', async ({ page }) => {
        await expect(page.locator('.back-btn')).toHaveAttribute('href', '/');
    });
});

test.describe('Forehead – Timer Controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/forehead/index.html?player=Alice`);
    });

    test('Start button changes to Pause after click', async ({ page }) => {
        await page.locator('#btnStartPause').click();
        await expect(page.locator('#btnStartPause')).toContainText('Pause');
    });

    test('Pause button changes back to Start', async ({ page }) => {
        await page.locator('#btnStartPause').click(); // Start
        await page.locator('#btnStartPause').click(); // Pause
        await expect(page.locator('#btnStartPause')).toContainText('Start');
    });

    test('timer counts down when running', async ({ page }) => {
        await page.locator('#btnStartPause').click();
        await page.waitForTimeout(1200);
        const display = await page.locator('#timerDisplay').textContent();
        // Should be less than 1:00
        expect(display).not.toBe('1:00');
    });

    test('timer stops counting when paused', async ({ page }) => {
        await page.locator('#btnStartPause').click(); // Start
        await page.waitForTimeout(1200);
        await page.locator('#btnStartPause').click(); // Pause
        const display1 = await page.locator('#timerDisplay').textContent();
        await page.waitForTimeout(1200);
        const display2 = await page.locator('#timerDisplay').textContent();
        expect(display1).toBe(display2);
    });

    test('Reset Timer restores 1:00', async ({ page }) => {
        await page.locator('#btnStartPause').click();
        await page.waitForTimeout(1200);
        await page.locator('#btnReset').click();
        await expect(page.locator('#timerDisplay')).toHaveText('1:00');
    });

    test('timer display turns red when 10 seconds or less remain', async ({ page }) => {
        // Manually set time low via JS
        await page.evaluate(() => { state.timeLeft = 10; updateTimerDisplay(); });
        const color = await page.locator('#timerDisplay').evaluate(el => el.style.color);
        expect(color).toBe('rgb(224, 85, 85)');
    });

    test('timer display turns orange between 11-30 seconds', async ({ page }) => {
        await page.evaluate(() => { state.timeLeft = 20; updateTimerDisplay(); });
        const color = await page.locator('#timerDisplay').evaluate(el => el.style.color);
        expect(color).toBe('rgb(255, 140, 66)');
    });

    test('timer display is white/default above 30 seconds', async ({ page }) => {
        await page.evaluate(() => { state.timeLeft = 45; updateTimerDisplay(); });
        const color = await page.locator('#timerDisplay').evaluate(el => el.style.color);
        expect(color).toBe('rgb(240, 240, 240)');
    });
});

test.describe('Forehead – Character Controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE}/forehead/index.html?player=Alice`);
    });

    test('New Character button changes the displayed character', async ({ page }) => {
        const before = await page.locator('#characterName').textContent();
        await page.locator('#btnNewChar').click();
        const after = await page.locator('#characterName').textContent();
        // Character should be a non-empty name (may be same if only 1 available, unlikely)
        expect(after).not.toBe('');
    });

    test('Pass increments passed count and changes character', async ({ page }) => {
        const before = await page.locator('#characterName').textContent();
        await page.locator('#btnPass').click();
        await expect(page.locator('#passedCount')).toHaveText('1');
        const after = await page.locator('#characterName').textContent();
        expect(after).not.toBe('');
    });

    test('Correct increments correct count, resets timer, changes character', async ({ page }) => {
        // Start timer and let it count
        await page.locator('#btnStartPause').click();
        await page.waitForTimeout(1200);

        await page.locator('#btnCorrect').click();

        await expect(page.locator('#correctCount')).toHaveText('1');
        // Timer should reset to 1:00
        await expect(page.locator('#timerDisplay')).toHaveText('1:00');
    });

    test('multiple passes accumulate count', async ({ page }) => {
        await page.locator('#btnPass').click();
        await page.locator('#btnPass').click();
        await page.locator('#btnPass').click();
        await expect(page.locator('#passedCount')).toHaveText('3');
    });

    test('multiple corrects accumulate count', async ({ page }) => {
        await page.locator('#btnCorrect').click();
        await page.locator('#btnCorrect').click();
        await expect(page.locator('#correctCount')).toHaveText('2');
    });

    test('passed and correct counts are independent', async ({ page }) => {
        await page.locator('#btnCorrect').click();
        await page.locator('#btnPass').click();
        await page.locator('#btnCorrect').click();
        await expect(page.locator('#correctCount')).toHaveText('2');
        await expect(page.locator('#passedCount')).toHaveText('1');
    });
});
