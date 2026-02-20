import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import DigitalClock from "./DigitalClock";

describe("DigitalClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a time in HH:MM:SS format", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    // The clock splits time across multiple nodes with colon spans, so check overall text content
    expect(link.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("displays zero-padded hours, minutes, and seconds", () => {
    // Set a specific time with single-digit values
    const fixedDate = new Date(2026, 0, 1, 5, 7, 9); // 05:07:09
    vi.setSystemTime(fixedDate);
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    // Even seconds (9 is odd, so colons hidden but text content still has colon chars)
    expect(link.textContent).toBe("05:07:09");
  });

  it("updates the time every second", () => {
    const fixedDate = new Date(2026, 0, 1, 12, 0, 0); // 12:00:00
    vi.setSystemTime(fixedDate);
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link.textContent).toBe("12:00:00");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(link.textContent).toBe("12:00:01");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(link.textContent).toBe("12:00:02");
  });

  it("cleans up the interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(<DigitalClock />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("renders an anchor link to nba.com", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toHaveAttribute("href", "https://www.nba.com");
  });

  it("opens in a new tab with noopener noreferrer", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has aria-label describing the destination", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toHaveAttribute("aria-label", "Visit NBA.com");
  });

  it("applies monospace font class", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link.className).toContain("font-mono");
  });

  it("applies black background and red text styles", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i }) as HTMLElement;
    expect(link.style.backgroundColor).toBe("rgb(0, 0, 0)");
    expect(link.style.color).toBe("rgb(255, 0, 0)");
  });

  it("has cursor-pointer class for hover state", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link.className).toContain("cursor-pointer");
  });

  it("has rounded corners and padding classes", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link.className).toContain("rounded");
    expect(link.className).toMatch(/p[xy]-\d|px-\d|py-\d/);
  });

  it("is horizontally centered with mx-auto", () => {
    render(<DigitalClock />);
    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link.className).toContain("mx-auto");
  });

  // US-002: Blinking Colons tests
  describe("blinking colons (US-002)", () => {
    it("renders exactly two colon spans with data-testid='clock-colon'", () => {
      render(<DigitalClock />);
      const colons = screen.getAllByTestId("clock-colon");
      expect(colons).toHaveLength(2);
    });

    it("colons are visible on even seconds", () => {
      // second=0 is even
      const evenSecondDate = new Date(2026, 0, 1, 12, 0, 0);
      vi.setSystemTime(evenSecondDate);
      render(<DigitalClock />);
      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });
    });

    it("colons are hidden on odd seconds", () => {
      // second=1 is odd
      const oddSecondDate = new Date(2026, 0, 1, 12, 0, 1);
      vi.setSystemTime(oddSecondDate);
      render(<DigitalClock />);
      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "hidden" });
      });
    });

    it("colons toggle visibility each second (even -> odd -> even)", () => {
      // Start at even second (0)
      const startDate = new Date(2026, 0, 1, 12, 0, 0);
      vi.setSystemTime(startDate);
      render(<DigitalClock />);

      let colons = screen.getAllByTestId("clock-colon");
      // second=0, even => visible
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });

      // Advance to second=1, odd => hidden
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "hidden" });
      });

      // Advance to second=2, even => visible
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });
    });

    it("colons use equal-width blank space so digits do not shift (inline-block with fixed width)", () => {
      render(<DigitalClock />);
      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        // Should be display:inline-block with a fixed width to maintain layout
        expect(colon).toHaveStyle({ display: "inline-block" });
        // Width should be set (non-empty)
        const width = (colon as HTMLElement).style.width;
        expect(width).toBeTruthy();
      });
    });

    it("blinking is driven by the single setInterval (only one interval is created)", () => {
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
      render(<DigitalClock />);
      // Only one interval should be created for both clock update and colon blink
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it("colon visibility updates when the timer fires (same timer drives both clock and colons)", () => {
      // Even second => colons visible
      const startDate = new Date(2026, 0, 1, 12, 0, 2);
      vi.setSystemTime(startDate);
      render(<DigitalClock />);

      let colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });

      // After 1 second, both clock and colons should update together
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const link = screen.getByRole("link", { name: /visit nba\.com/i });
      expect(link.textContent).toBe("12:00:03");

      colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        // second=3 is odd => hidden
        expect(colon).toHaveStyle({ visibility: "hidden" });
      });
    });
  });
});
