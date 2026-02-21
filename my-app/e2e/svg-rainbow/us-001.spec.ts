import { test, expect } from "@playwright/test";

test.describe("US-001: SVG Rainbow Arc on Main Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the RainbowArc SVG element with correct testid", async ({
    page,
  }) => {
    const svg = page.getByTestId("rainbow-arc");
    await expect(svg).toBeVisible();
  });

  test("SVG has role='img' for accessibility", async ({ page }) => {
    const svg = page.getByTestId("rainbow-arc");
    await expect(svg).toHaveAttribute("role", "img");
  });

  test("SVG has aria-label of 'Decorative rainbow'", async ({ page }) => {
    const svg = page.getByTestId("rainbow-arc");
    await expect(svg).toHaveAttribute("aria-label", "Decorative rainbow");
  });

  test("SVG contains exactly seven path elements (ROYGBIV)", async ({
    page,
  }) => {
    const paths = page.locator('[data-testid="rainbow-arc"] path');
    await expect(paths).toHaveCount(7);
  });

  test("paths use correct ROYGBIV stroke colors", async ({ page }) => {
    const expectedColors = [
      "#FF0000", // red
      "#FF7F00", // orange
      "#FFFF00", // yellow
      "#00FF00", // green
      "#0000FF", // blue
      "#4B0082", // indigo
      "#9400D3", // violet
    ];

    const paths = page.locator('[data-testid="rainbow-arc"] path');
    const count = await paths.count();
    expect(count).toBe(7);

    for (let i = 0; i < count; i++) {
      const stroke = await paths.nth(i).getAttribute("stroke");
      expect(stroke?.toUpperCase()).toBe(expectedColors[i]);
    }
  });

  test("paths have stroke-width of 8 and fill of none", async ({ page }) => {
    const paths = page.locator('[data-testid="rainbow-arc"] path');
    const count = await paths.count();

    for (let i = 0; i < count; i++) {
      const strokeWidth = await paths.nth(i).getAttribute("stroke-width");
      const fill = await paths.nth(i).getAttribute("fill");
      expect(strokeWidth).toBe("8");
      expect(fill).toBe("none");
    }
  });

  test("paths use SVG arc commands in their d attribute", async ({ page }) => {
    const paths = page.locator('[data-testid="rainbow-arc"] path');
    const count = await paths.count();

    for (let i = 0; i < count; i++) {
      const d = await paths.nth(i).getAttribute("d");
      // SVG arc command contains 'A' or 'a'
      expect(d).toMatch(/[Aa]/);
      // Should start with M (moveto)
      expect(d).toMatch(/^M/);
    }
  });

  test("SVG has a viewBox attribute that frames the arcs", async ({ page }) => {
    const svg = page.getByTestId("rainbow-arc");
    const viewBox = await svg.getAttribute("viewBox");
    expect(viewBox).toBeTruthy();
    // viewBox should be "0 0 width height" format
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
  });

  test("SVG is horizontally centered on the page", async ({ page }) => {
    const svg = page.getByTestId("rainbow-arc");
    const style = await svg.getAttribute("style");
    // The component sets margin: "0 auto" and display: "block"
    expect(style).toContain("margin");
    expect(style).toContain("auto");
  });

  test("RainbowArc is placed below the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    const svg = page.getByTestId("rainbow-arc");

    const headingBox = await heading.boundingBox();
    const svgBox = await svg.boundingBox();

    expect(headingBox).not.toBeNull();
    expect(svgBox).not.toBeNull();

    // The SVG should appear below the heading
    expect(svgBox!.y).toBeGreaterThan(headingBox!.y);
  });

  test("SVG has opacity 1 after page load (fade-in animation)", async ({
    page,
  }) => {
    const svg = page.getByTestId("rainbow-arc");
    // Wait for the element to be visible (animation completes quickly via rAF)
    await expect(svg).toBeVisible();

    // Check that opacity is 1 after load
    const opacity = await svg.evaluate((el) => {
      return (el as HTMLElement).style.opacity;
    });
    expect(opacity).toBe("1");
  });

  test("SVG has a CSS opacity transition of 1 second", async ({ page }) => {
    const svg = page.getByTestId("rainbow-arc");
    const transition = await svg.evaluate((el) => {
      return (el as HTMLElement).style.transition;
    });
    // Should contain opacity with 1s duration
    expect(transition).toContain("opacity");
    expect(transition).toContain("1s");
  });
});
