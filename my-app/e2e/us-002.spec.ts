import { test, expect } from "@playwright/test";

test.describe("US-002: Blinking Colons Like a Real 80s Clock", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Two colon spans with data-testid='clock-colon' are present", async ({
    page,
  }) => {
    const colons = page.locator("[data-testid='clock-colon']");
    await expect(colons).toHaveCount(2);
  });

  test("Colons have fixed width to prevent digit shifting when hidden", async ({
    page,
  }) => {
    const colons = page.locator("[data-testid='clock-colon']");

    for (let i = 0; i < 2; i++) {
      const colon = colons.nth(i);
      const display = await colon.evaluate((el) => {
        return window.getComputedStyle(el).display;
      });
      // Must be inline-block (or block) to have a fixed width
      expect(["inline-block", "block"]).toContain(display);

      const width = await colon.evaluate((el) => {
        return window.getComputedStyle(el).width;
      });
      // Width must be a real value (not 0px or auto)
      expect(parseFloat(width)).toBeGreaterThan(0);
    }
  });

  test("Colon visibility toggles between even and odd seconds", async ({
    page,
  }) => {
    // Wait until we know what second we are on by checking colon visibility
    const colons = page.locator("[data-testid='clock-colon']");

    // Sample visibility at current moment
    const initialVisible = await colons.first().evaluate((el) => {
      return window.getComputedStyle(el).visibility;
    });

    // Wait ~1.1 seconds for the next tick
    await page.waitForTimeout(1100);

    const nextVisible = await colons.first().evaluate((el) => {
      return window.getComputedStyle(el).visibility;
    });

    // Visibility must have toggled
    expect(initialVisible).not.toBe(nextVisible);
  });

  test("Both colons have the same visibility state at any given time", async ({
    page,
  }) => {
    const colons = page.locator("[data-testid='clock-colon']");

    const vis0 = await colons.nth(0).evaluate((el) => {
      return window.getComputedStyle(el).visibility;
    });
    const vis1 = await colons.nth(1).evaluate((el) => {
      return window.getComputedStyle(el).visibility;
    });

    expect(vis0).toBe(vis1);
  });

  test("Colons alternate visibility each second over multiple ticks", async ({
    page,
  }) => {
    const colons = page.locator("[data-testid='clock-colon']");

    // Collect visibility states over 3 seconds
    const states: string[] = [];
    for (let i = 0; i < 3; i++) {
      const vis = await colons.first().evaluate((el) => {
        return window.getComputedStyle(el).visibility;
      });
      states.push(vis);
      if (i < 2) {
        await page.waitForTimeout(1100);
      }
    }

    // States should alternate: e.g. visible, hidden, visible OR hidden, visible, hidden
    expect(states[0]).not.toBe(states[1]);
    expect(states[1]).not.toBe(states[2]);
    expect(states[0]).toBe(states[2]);
  });

  test("Colon width stays constant whether visible or hidden (no layout shift)", async ({
    page,
  }) => {
    const colons = page.locator("[data-testid='clock-colon']");
    const clock = page.locator('a[aria-label="Visit NBA.com"]');

    // Record clock width and colon width at current moment
    const clockWidth1 = await clock.evaluate((el) => el.getBoundingClientRect().width);
    const colonWidth1 = await colons.first().evaluate((el) => el.getBoundingClientRect().width);

    // Wait for next tick (visibility toggle)
    await page.waitForTimeout(1100);

    const clockWidth2 = await clock.evaluate((el) => el.getBoundingClientRect().width);
    const colonWidth2 = await colons.first().evaluate((el) => el.getBoundingClientRect().width);

    // Clock width should not change (no layout shift)
    expect(Math.abs(clockWidth1 - clockWidth2)).toBeLessThan(2);

    // Colon width should remain the same (fixed-width placeholder)
    expect(Math.abs(colonWidth1 - colonWidth2)).toBeLessThan(2);
  });
});
