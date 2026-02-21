"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "#FF0000", // red
  "#FF7F00", // orange
  "#FFFF00", // yellow
  "#00FF00", // green
  "#0000FF", // blue
  "#4B0082", // indigo
  "#9400D3", // violet
];

const OUTER_RADIUS = 150;
const RADIUS_STEP = 10;
const STROKE_WIDTH = 8;
const CX = 160;
const CY = 160;

function describeArc(cx: number, cy: number, r: number): string {
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  // Draw a semi-circle arc from left to right (top half)
  return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
}

export default function RainbowArc() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in on mount
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const radii = COLORS.map((_, i) => OUTER_RADIUS - i * RADIUS_STEP);

  // viewBox: need to show all arcs. The widest arc spans from CX-150 to CX+150 horizontally
  // and from CY downward (semi-circle top). Add padding for stroke.
  const padding = STROKE_WIDTH;
  const viewBoxX = CX - OUTER_RADIUS - padding;
  const viewBoxY = CY - OUTER_RADIUS - padding;
  const viewBoxWidth = (OUTER_RADIUS + padding) * 2;
  const viewBoxHeight = OUTER_RADIUS + padding * 2;

  return (
    <svg
      data-testid="rainbow-arc"
      role="img"
      aria-label="Decorative rainbow"
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
      width={viewBoxWidth}
      height={viewBoxHeight}
      style={{
        display: "block",
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 1s ease",
      }}
    >
      {COLORS.map((color, i) => (
        <path
          key={color}
          d={describeArc(CX, CY, radii[i])}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
      ))}
    </svg>
  );
}
