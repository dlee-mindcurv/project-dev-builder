import { test, expect } from "@playwright/test";

test.describe("US-002: Blinking Colons Like a Real 80s Clock", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Two colon spans with data-testid='clock-colon' are present in the clock", async ({
    page,
  }) => {
    const colonSpans = page.locator("[data-testid='clock-colon']");
    await expect(colonSpans).toHaveCount(2);
  });

  test("Each colon span contains a colon character", async ({ page }) => {
    const colonSpans = page.locator("[data-testid='clock-colon']");
    await expect(colonSpans).toHaveCount(2);

    const firstColon = colonSpans.nth(0);
    const secondColon = colonSpans.nth(1);

    await expect(firstColon).toHaveText(":");
    await expect(secondColon).toHaveText(":");
  });

  test("Colon spans have inline-block display and a fixed width so digits don't shift", async ({
    page,
  }) => {
    const colonSpans = page.locator("[data-testid='clock-colon']");
    await expect(colonSpans).toHaveCount(2);

    const styles = await colonSpans.evaluateAll((spans) =>
      spans.map((span) => {
        const computed = window.getComputedStyle(span);
        return {
          display: computed.display,
          width: computed.width,
        };
      })
    );

    for (const style of styles) {
      // Should be inline-block to preserve width when hidden
      expect(style.display).toBe("inline-block");
      // Width should be non-zero (fixed width)
      const width = parseFloat(style.width);
      expect(width).toBeGreaterThan(0);
    }
  });

  test("Colons visibility toggles between visible and hidden (blinking behavior)", async ({
    page,
  }) => {
    const colonSpans = page.locator("[data-testid='clock-colon']");
    await expect(colonSpans).toHaveCount(2);

    // Get the initial visibility state
    const initialVisibility = await colonSpans.evaluateAll((spans) =>
      spans.map((span) => window.getComputedStyle(span).visibility)
    );

    // Both colons should have the same visibility state (either both visible or both hidden)
    expect(initialVisibility[0]).toBe(initialVisibility[1]);
    expect(["visible", "hidden"]).toContain(initialVisibility[0]);

    // Wait a bit more than one second for the toggle
    await page.waitForTimeout(1100);

    const nextVisibility = await colonSpans.evaluateAll((spans) =>
      spans.map((span) => window.getComputedStyle(span).visibility)
    );

    // Both colons should still have the same visibility state
    expect(nextVisibility[0]).toBe(nextVisibility[1]);
    // The visibility should have changed from the initial state
    expect(nextVisibility[0]).not.toBe(initialVisibility[0]);
  });

  test("Colons are visible on even seconds, hidden on odd seconds", async ({
    page,
  }) => {
    // Wait until we're at a known even second boundary
    // Check visibility against the current seconds value
    const clockElement = page.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockElement).toBeVisible();

    const colonSpans = page.locator("[data-testid='clock-colon']");

    // Read text to get current seconds
    const clockText = await clockElement.textContent();
    const currentSeconds = clockText ? parseInt(clockText.split(":")[2]) : 0;
    const expectedVisibility = currentSeconds % 2 === 0 ? "visible" : "hidden";

    const visibility = await colonSpans.evaluateAll((spans) =>
      spans.map((span) => window.getComputedStyle(span).visibility)
    );

    expect(visibility[0]).toBe(expectedVisibility);
    expect(visibility[1]).toBe(expectedVisibility);
  });

  test("Clock still displays correct digit format with blinking colons", async ({
    page,
  }) => {
    // Clock digits should always be present regardless of colon visibility
    const clockElement = page.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockElement).toBeVisible();

    // The clock text content (with colons) should match HH:MM:SS format
    const clockText = await clockElement.textContent();
    // textContent includes the colon characters even if hidden (CSS visibility)
    expect(clockText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test("Colon spans are inside the clock container with the digits", async ({
    page,
  }) => {
    const clockDiv = page.locator('a[aria-label="Visit NBA.com"] > div');
    await expect(clockDiv).toBeVisible();

    // Colons should be inside the clock div
    const colonSpansInClock = clockDiv.locator("[data-testid='clock-colon']");
    await expect(colonSpansInClock).toHaveCount(2);
  });
});
