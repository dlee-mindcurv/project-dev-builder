import { test, expect } from "@playwright/test";

test.describe("US-001: Digital Clock in Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("DigitalClock is rendered inside Footer after Back to Top and before decorative dots", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const backToTop = footer.locator("button", { hasText: "Back to Top" });
    await expect(backToTop).toBeVisible();

    const clockLink = footer.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockLink).toBeVisible();

    // Check ordering: Back to Top button comes before the clock
    const backToTopIndex = await footer
      .locator("button, a[aria-label='Visit NBA.com'], div.flex.gap-2")
      .evaluateAll((elements) => {
        const btn = elements.find(
          (el) => el.tagName === "BUTTON" && el.textContent?.includes("Back to Top")
        );
        const clock = elements.find(
          (el) => el.tagName === "A" && el.getAttribute("aria-label") === "Visit NBA.com"
        );
        if (!btn || !clock) return null;
        const allEls = Array.from(btn.parentElement?.children || []);
        return {
          btnIdx: allEls.indexOf(btn as HTMLElement),
          clockIdx: allEls.indexOf(clock as HTMLElement),
        };
      });

    if (backToTopIndex) {
      expect(backToTopIndex.btnIdx).toBeLessThan(backToTopIndex.clockIdx);
    }
  });

  test("Clock displays time in HH:MM:SS 24-hour format, zero-padded", async ({
    page,
  }) => {
    const clockLink = page.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockLink).toBeVisible();

    const clockText = await clockLink.textContent();
    expect(clockText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  test("Clock digits are red on black background with monospace font", async ({
    page,
  }) => {
    const clockDiv = page.locator('a[aria-label="Visit NBA.com"] > div');
    await expect(clockDiv).toBeVisible();

    const styles = await clockDiv.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontFamily: computed.fontFamily,
      };
    });

    // Check red color (#ff0000 = rgb(255, 0, 0))
    expect(styles.color).toBe("rgb(255, 0, 0)");
    // Check black background (#000000 = rgb(0, 0, 0))
    expect(styles.backgroundColor).toBe("rgb(0, 0, 0)");
    // Check monospace font
    expect(styles.fontFamily.toLowerCase()).toContain("mono");
  });

  test("Clock container has rounded corners and padding", async ({ page }) => {
    const clockDiv = page.locator('a[aria-label="Visit NBA.com"] > div');
    await expect(clockDiv).toBeVisible();

    const styles = await clockDiv.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
      };
    });

    // Should have non-zero border radius (rounded corners)
    const radius = parseFloat(styles.borderRadius);
    expect(radius).toBeGreaterThan(0);

    // Should have padding
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingRight = parseFloat(styles.paddingRight);
    expect(paddingTop).toBeGreaterThan(0);
    expect(paddingRight).toBeGreaterThan(0);
  });

  test("Clock link opens NBA.com in new tab with correct attributes", async ({
    page,
  }) => {
    const clockLink = page.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockLink).toBeVisible();

    await expect(clockLink).toHaveAttribute("href", "https://www.nba.com");
    await expect(clockLink).toHaveAttribute("target", "_blank");
    await expect(clockLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(clockLink).toHaveAttribute("aria-label", "Visit NBA.com");
  });

  test("Clock is horizontally centered in the footer", async ({ page }) => {
    const clockLink = page.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockLink).toBeVisible();

    // Check the link has flex justify-center class
    const hasJustifyCenter = await clockLink.evaluate((el) =>
      el.classList.contains("justify-center")
    );
    expect(hasJustifyCenter).toBe(true);
  });

  test("Clock has cursor-pointer style", async ({ page }) => {
    const clockDiv = page.locator('a[aria-label="Visit NBA.com"] > div');
    await expect(clockDiv).toBeVisible();

    const cursor = await clockDiv.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe("pointer");
  });

  test("Clock styling is same in dark mode (black bg, red digits)", async ({
    page,
  }) => {
    // Enable dark mode by adding class to html element
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    const clockDiv = page.locator('a[aria-label="Visit NBA.com"] > div');
    await expect(clockDiv).toBeVisible();

    const styles = await clockDiv.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    expect(styles.color).toBe("rgb(255, 0, 0)");
    expect(styles.backgroundColor).toBe("rgb(0, 0, 0)");
  });

  test("Decorative dots appear after the clock in the footer", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    const clockLink = footer.locator('a[aria-label="Visit NBA.com"]');
    await expect(clockLink).toBeVisible();

    // The decorative dots container should exist
    const dotsContainer = footer.locator("div.flex.gap-2");
    await expect(dotsContainer).toBeVisible();

    // Check the clock comes before the dots in the DOM
    const order = await footer.evaluate((footerEl) => {
      const children = Array.from(footerEl.children);
      const clockIdx = children.findIndex(
        (el) => el.tagName === "A" && el.getAttribute("aria-label") === "Visit NBA.com"
      );
      const dotsIdx = children.findIndex(
        (el) =>
          el.tagName === "DIV" &&
          el.classList.contains("flex") &&
          el.classList.contains("gap-2")
      );
      return { clockIdx, dotsIdx };
    });

    expect(order.clockIdx).toBeGreaterThan(-1);
    expect(order.dotsIdx).toBeGreaterThan(-1);
    expect(order.clockIdx).toBeLessThan(order.dotsIdx);
  });
});
