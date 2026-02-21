import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RainbowArc from "./RainbowArc";

describe("RainbowArc", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders an SVG element with data-testid='rainbow-arc'", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe("svg");
  });

  it("has role='img' on the SVG element", () => {
    render(<RainbowArc />);
    const svg = screen.getByRole("img");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("data-testid", "rainbow-arc");
  });

  it("has aria-label='Decorative rainbow' for accessibility", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    expect(svg).toHaveAttribute("aria-label", "Decorative rainbow");
  });

  it("renders exactly seven <path> elements for the ROYGBIV spectrum", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");
    expect(paths.length).toBe(7);
  });

  it("uses the correct ROYGBIV colors as stroke on each arc", () => {
    const expectedColors = [
      "#FF0000", // red
      "#FF7F00", // orange
      "#FFFF00", // yellow
      "#00FF00", // green
      "#0000FF", // blue
      "#4B0082", // indigo
      "#9400D3", // violet
    ];

    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");

    paths.forEach((path, i) => {
      expect(path.getAttribute("stroke")?.toUpperCase()).toBe(
        expectedColors[i].toUpperCase()
      );
    });
  });

  it("each path has stroke-width of 8", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");

    paths.forEach((path) => {
      expect(path.getAttribute("stroke-width")).toBe("8");
    });
  });

  it("each path has fill='none'", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");

    paths.forEach((path) => {
      expect(path.getAttribute("fill")).toBe("none");
    });
  });

  it("each path uses an SVG arc command (A command) in the 'd' attribute", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");

    paths.forEach((path) => {
      const d = path.getAttribute("d");
      expect(d).toBeTruthy();
      // The arc command 'A' or 'a' must be present
      expect(d).toMatch(/[Aa]/);
    });
  });

  it("the outermost arc (red) has a radius of approximately 150px", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");
    const firstPath = paths[0]; // red arc (outermost)
    const d = firstPath.getAttribute("d") ?? "";

    // The 'd' attribute should contain "150" as the radius in the arc command
    // Pattern: M startX startY A rx ry x-rotation large-arc-flag sweep-flag endX endY
    // We look for "A 150 150" pattern
    expect(d).toMatch(/A\s+150\s+150/);
  });

  it("each inner arc decreases by 10px radius from the previous", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const paths = svg.querySelectorAll("path");

    const radii = Array.from(paths).map((path) => {
      const d = path.getAttribute("d") ?? "";
      // Extract rx from arc command: A rx ry ...
      const match = d.match(/A\s+([\d.]+)\s+([\d.]+)/);
      return match ? parseFloat(match[1]) : null;
    });

    expect(radii[0]).toBe(150); // red
    expect(radii[1]).toBe(140); // orange
    expect(radii[2]).toBe(130); // yellow
    expect(radii[3]).toBe(120); // green
    expect(radii[4]).toBe(110); // blue
    expect(radii[5]).toBe(100); // indigo
    expect(radii[6]).toBe(90);  // violet
  });

  it("has a viewBox attribute on the SVG element", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    expect(svg).toHaveAttribute("viewBox");

    const viewBox = svg.getAttribute("viewBox");
    expect(viewBox).toBeTruthy();
    // viewBox should have 4 numeric values
    const parts = viewBox!.trim().split(/\s+/);
    expect(parts.length).toBe(4);
    parts.forEach((part) => {
      expect(isNaN(Number(part))).toBe(false);
    });
  });

  it("starts with opacity 0 before animation frame fires", () => {
    // Mock requestAnimationFrame to not fire immediately
    const rafMock = vi.spyOn(global, "requestAnimationFrame").mockImplementation(() => 0);

    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");

    // Before the rAF callback fires, opacity should be 0
    expect(svg).toHaveStyle({ opacity: 0 });

    rafMock.mockRestore();
  });

  it("has a CSS opacity transition of 1 second on the SVG", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    // The inline style should include transition
    const style = (svg as HTMLElement).style;
    expect(style.transition).toContain("opacity 1s");
  });

  it("transitions to opacity 1 after requestAnimationFrame fires", () => {
    let rafCallback: FrameRequestCallback | null = null;
    const rafMock = vi.spyOn(global, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");

    // Before the rAF fires, opacity should be 0
    expect(svg).toHaveStyle({ opacity: 0 });

    // Fire the rAF callback
    act(() => {
      if (rafCallback) rafCallback(0);
    });

    // After rAF fires, opacity should be 1
    expect(svg).toHaveStyle({ opacity: 1 });

    rafMock.mockRestore();
  });

  it("renders inline SVG (not an img tag or external file reference)", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");

    // Should be an SVG element, not an img
    expect(svg.tagName.toLowerCase()).toBe("svg");

    // Should not have a src attribute (which would indicate external file)
    expect(svg).not.toHaveAttribute("src");

    // Should not have an href pointing to an external file
    const href = svg.getAttribute("href");
    expect(href).toBeNull();
  });

  it("SVG has display block and margin auto for centering", () => {
    render(<RainbowArc />);
    const svg = screen.getByTestId("rainbow-arc");
    const style = (svg as HTMLElement).style;
    expect(style.display).toBe("block");
    expect(style.margin).toBe("0px auto");
  });
});
