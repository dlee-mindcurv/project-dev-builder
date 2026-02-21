import { test, expect } from "@playwright/test";

test.describe("US-001: SVG Rainbow Arc on Main Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("RainbowArc SVG element is present with correct data-testid", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    await expect(svg).toBeVisible();
  });

  test("SVG has role='img' and aria-label='Decorative rainbow' for accessibility", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAttribute("aria-label", "Decorative rainbow");
  });

  test("SVG is an inline element (not an img tag pointing to external file)", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const tagName = await svg.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("svg");
  });

  test("SVG contains seven path elements for the ROYGBIV arcs", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const paths = svg.locator("path");
    await expect(paths).toHaveCount(7);
  });

  test("Each arc path uses SVG arc command (contains 'A' in d attribute)", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const paths = svg.locator("path");
    const count = await paths.count();
    expect(count).toBe(7);

    for (let i = 0; i < count; i++) {
      const d = await paths.nth(i).getAttribute("d");
      expect(d).toMatch(/A/i);
    }
  });

  test("Each arc path has stroke-width of 8px", async ({ page }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const paths = svg.locator("path");
    const count = await paths.count();

    for (let i = 0; i < count; i++) {
      const strokeWidth = await paths.nth(i).getAttribute("stroke-width");
      expect(strokeWidth).toBe("8");
    }
  });

  test("Each arc path has fill='none'", async ({ page }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const paths = svg.locator("path");
    const count = await paths.count();

    for (let i = 0; i < count; i++) {
      const fill = await paths.nth(i).getAttribute("fill");
      expect(fill).toBe("none");
    }
  });

  test("Arc paths use the correct ROYGBIV colors", async ({ page }) => {
    const expectedColors = [
      "#FF0000", // red
      "#FF7F00", // orange
      "#FFFF00", // yellow
      "#00FF00", // green
      "#0000FF", // blue
      "#4B0082", // indigo
      "#9400D3", // violet
    ];

    const svg = page.locator('[data-testid="rainbow-arc"]');
    const paths = svg.locator("path");

    for (let i = 0; i < expectedColors.length; i++) {
      const stroke = await paths.nth(i).getAttribute("stroke");
      expect(stroke?.toUpperCase()).toBe(expectedColors[i].toUpperCase());
    }
  });

  test("SVG has a viewBox attribute", async ({ page }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const viewBox = await svg.getAttribute("viewBox");
    expect(viewBox).toBeTruthy();
    // viewBox should have 4 numeric values
    const parts = viewBox!.trim().split(/\s+/);
    expect(parts).toHaveLength(4);
    parts.forEach((part) => {
      expect(Number(part)).not.toBeNaN();
    });
  });

  test("RainbowArc SVG is horizontally centered on the page", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');
    const style = await svg.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
      };
    });
    // The component sets display:block and margin:0 auto for centering
    expect(style.display).toBe("block");
    expect(style.marginLeft).toBe(style.marginRight);
  });

  test("RainbowArc is placed below the main heading", async ({ page }) => {
    const heading = page.locator("h1").first();
    const svg = page.locator('[data-testid="rainbow-arc"]');

    const headingBox = await heading.boundingBox();
    const svgBox = await svg.boundingBox();

    expect(headingBox).toBeTruthy();
    expect(svgBox).toBeTruthy();

    // SVG should be below (greater Y value) the heading
    expect(svgBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height - 1);
  });

  test("Rainbow fades in on page load using CSS opacity transition", async ({
    page,
  }) => {
    const svg = page.locator('[data-testid="rainbow-arc"]');

    // Wait for the SVG to be visible first
    await expect(svg).toBeVisible();

    // Check that the CSS transition property is set for opacity with 1s duration
    const transition = await svg.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.transition;
    });
    expect(transition).toContain("opacity");
    expect(transition).toMatch(/1s/);

    // Wait for the opacity transition to complete (1s + buffer)
    await page.waitForTimeout(1500);

    // After fade-in completes, opacity should be 1
    const opacity = await svg.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(opacity).toBe("1");
  });
});
