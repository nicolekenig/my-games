import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 15000,
    expect: { timeout: 5000 },
    fullyParallel: false,
    workers: 1,          // Serial execution: tests share a single game server room
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:3000',
        channel: 'chrome',
        headless: true,
        trace: 'on-first-retry',
    },
    // Always start a fresh server so in-memory game room state is clean.
    // Run `npm test` (not `npx playwright test` directly) which kills any
    // existing server first via the pretest script.
    webServer: {
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 10000,
    },
});
