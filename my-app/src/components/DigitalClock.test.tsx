import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import DigitalClock from "./DigitalClock";

describe("DigitalClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a time in HH:MM:SS 24-hour format", () => {
    // Fix the date to a known time
    const fixedDate = new Date(2026, 0, 1, 14, 35, 7); // 14:35:07
    vi.setSystemTime(fixedDate);

    render(<DigitalClock />);

    // The clock renders hours/minutes/seconds as separate text nodes with colon spans
    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv?.textContent).toContain("14");
    expect(clockDiv?.textContent).toContain("35");
    expect(clockDiv?.textContent).toContain("07");
  });

  it("displays zero-padded hours, minutes, and seconds", () => {
    const fixedDate = new Date(2026, 0, 1, 9, 5, 3); // 09:05:03
    vi.setSystemTime(fixedDate);

    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv?.textContent).toContain("09");
    expect(clockDiv?.textContent).toContain("05");
    expect(clockDiv?.textContent).toContain("03");
  });

  it("updates time every second", () => {
    const fixedDate = new Date(2026, 0, 1, 14, 35, 7);
    vi.setSystemTime(fixedDate);

    render(<DigitalClock />);
    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv?.textContent).toContain("07");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(clockDiv?.textContent).toContain("08");
  });

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(<DigitalClock />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("renders a link to NBA.com", () => {
    render(<DigitalClock />);

    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://www.nba.com");
  });

  it("opens NBA.com in a new tab", () => {
    render(<DigitalClock />);

    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("has rel='noopener noreferrer' on the link", () => {
    render(<DigitalClock />);

    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has an aria-label describing the destination", () => {
    render(<DigitalClock />);

    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link).toHaveAttribute("aria-label", "Visit NBA.com");
  });

  it("applies black background color", () => {
    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv).not.toBeNull();
    expect(clockDiv).toHaveStyle({ backgroundColor: "#000000" });
  });

  it("applies red digit color", () => {
    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv).not.toBeNull();
    expect(clockDiv).toHaveStyle({ color: "#ff0000" });
  });

  it("applies font-mono class for monospace font", () => {
    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv).not.toBeNull();
    expect(clockDiv?.className).toContain("font-mono");
  });

  it("applies rounded corners class", () => {
    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv).not.toBeNull();
    expect(clockDiv?.className).toMatch(/rounded/);
  });

  it("applies padding classes", () => {
    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv).not.toBeNull();
    expect(clockDiv?.className).toMatch(/p[xy]-\d+|px-\d+|py-\d+/);
  });

  it("applies cursor-pointer class", () => {
    render(<DigitalClock />);

    const clockDiv = screen.getByRole("link", { name: /visit nba\.com/i }).querySelector("div");
    expect(clockDiv).not.toBeNull();
    expect(clockDiv?.className).toContain("cursor-pointer");
  });

  it("link container has justify-center class for horizontal centering", () => {
    render(<DigitalClock />);

    const link = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(link.className).toContain("justify-center");
  });

  // US-002: Blinking Colons Like a Real 80s Clock
  describe("blinking colons", () => {
    it("renders two colon spans with data-testid='clock-colon'", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 6)); // even second
      render(<DigitalClock />);

      const colons = screen.getAllByTestId("clock-colon");
      expect(colons).toHaveLength(2);
    });

    it("colons are visible on even seconds", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 6)); // second=6, even
      render(<DigitalClock />);

      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });
    });

    it("colons are hidden on odd seconds", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 7)); // second=7, odd
      render(<DigitalClock />);

      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "hidden" });
      });
    });

    it("colons toggle from visible to hidden after one second (even -> odd)", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 6)); // even second
      render(<DigitalClock />);

      let colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "hidden" });
      });
    });

    it("colons toggle from hidden to visible after one second (odd -> even)", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 7)); // odd second
      render(<DigitalClock />);

      let colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "hidden" });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ visibility: "visible" });
      });
    });

    it("colons have equal-width inline-block display so digits do not shift", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 6));
      render(<DigitalClock />);

      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon).toHaveStyle({ display: "inline-block" });
        // width should be set (non-empty) to preserve space
        const width = colon.style.width;
        expect(width).toBeTruthy();
      });
    });

    it("each colon span contains the colon character", () => {
      vi.setSystemTime(new Date(2026, 0, 1, 14, 35, 6));
      render(<DigitalClock />);

      const colons = screen.getAllByTestId("clock-colon");
      colons.forEach((colon) => {
        expect(colon.textContent).toBe(":");
      });
    });
  });
});
