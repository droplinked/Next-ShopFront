import { test, expect } from '@playwright/test';
import { mockExternalServices } from '../helpers/network';
import { injectSession } from '../helpers/session';
import { byTestId } from '../helpers/testid';

/**
 * Audio playback — covers the "audio mysteriously dies on iOS" class of
 * bugs. iOS Safari has unique constraints:
 *   - Autoplay blocked until user gesture
 *   - Audio suspended on visibilitychange → hidden
 *   - Media Session API for lock-screen / Bluetooth headset control
 *   - MiniPlayer must not stack with full player
 *
 * CUSTOMIZE: replace SAMPLE_STORY_PATH and the testids below to match
 * your app's audio player contract.
 */

const SAMPLE_STORY_PATH = process.env.SAMPLE_STORY_PATH ?? '/story/sample';

test.describe('Audio playback', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalServices(page);
    await injectSession(page);
  });

  test('player renders with poster + play button', async ({ page }) => {
    await page.goto(SAMPLE_STORY_PATH);
    await expect(byTestId(page, 'audio-player')).toBeVisible();
    await expect(byTestId(page, 'play-button')).toBeVisible();
  });

  test('play → pause is synchronous (no stuck loading state)', async ({ page }) => {
    await page.goto(SAMPLE_STORY_PATH);
    const playBtn = byTestId(page, 'play-button');
    await playBtn.click();

    // Audio should report not-paused within 2s
    await expect.poll(
      async () => await page.evaluate(() => document.querySelector('audio')?.paused ?? true),
      { timeout: 2_000 },
    ).toBe(false);

    const pauseBtn = byTestId(page, 'pause-button');
    await pauseBtn.click();

    // Pause should be immediate
    await expect.poll(
      async () => await page.evaluate(() => document.querySelector('audio')?.paused ?? false),
      { timeout: 500 },
    ).toBe(true);
  });

  test('MiniPlayer is suppressed on /story/* (no double player)', async ({ page }) => {
    await page.goto(SAMPLE_STORY_PATH);
    // Full player visible, mini player hidden
    await expect(byTestId(page, 'audio-player')).toBeVisible();
    await expect(byTestId(page, 'mini-player')).not.toBeVisible();
  });

  test('audio resumes after visibility-change → hidden → visible', async ({ page }) => {
    await page.goto(SAMPLE_STORY_PATH);
    await byTestId(page, 'play-button').click();
    await page.waitForTimeout(500); // intentional: simulate playback start

    // Simulate tab hide + return
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Player state should be coherent — not stuck in loading
    const isStuck = await page.evaluate(() => {
      const a = document.querySelector('audio');
      return a?.readyState === 0;
    });
    expect(isStuck).toBe(false);
  });

  test('Media Session metadata populated for lock-screen control', async ({ page }) => {
    await page.goto(SAMPLE_STORY_PATH);
    await byTestId(page, 'play-button').click();

    await expect.poll(
      async () =>
        await page.evaluate(() => navigator.mediaSession?.metadata?.title ?? null),
      { timeout: 3_000 },
    ).not.toBeNull();
  });
});
