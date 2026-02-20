import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders the Back to Top button", () => {
    render(<Footer />);

    expect(screen.getByRole("button", { name: /back to top/i })).toBeInTheDocument();
  });

  it("renders the DigitalClock component", () => {
    render(<Footer />);

    // DigitalClock renders a link to NBA.com
    const clockLink = screen.getByRole("link", { name: /visit nba\.com/i });
    expect(clockLink).toBeInTheDocument();
  });

  it("renders decorative dots after the clock", () => {
    render(<Footer />);

    // The footer has decorative dots rendered as spans
    const footer = screen.getByRole("contentinfo");
    const spans = footer.querySelectorAll("span.rounded-full");
    expect(spans.length).toBe(3);
  });

  it("positions DigitalClock after Back to Top button and before decorative dots", () => {
    render(<Footer />);

    const footer = screen.getByRole("contentinfo");
    const children = footer.children;

    // First child is the Back to Top button
    expect(children[0].tagName).toBe("BUTTON");
    expect(children[0].textContent).toContain("Back to Top");

    // Second child is the DigitalClock (an anchor link to NBA.com)
    expect(children[1].tagName).toBe("A");
    expect(children[1]).toHaveAttribute("href", "https://www.nba.com");

    // Third child contains the decorative dots
    const dots = children[2].querySelectorAll("span.rounded-full");
    expect(dots.length).toBe(3);
  });
});
