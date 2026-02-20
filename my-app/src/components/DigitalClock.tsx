"use client";

import { useState, useEffect } from "react";

interface TimeState {
  hh: string;
  mm: string;
  ss: string;
  colonVisible: boolean;
}

function getTimeState(): TimeState {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const colonVisible = now.getSeconds() % 2 === 0;
  return { hh, mm, ss, colonVisible };
}

export default function DigitalClock() {
  const [timeState, setTimeState] = useState<TimeState>(() => getTimeState());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeState(getTimeState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { hh, mm, ss, colonVisible } = timeState;

  return (
    <a
      href="https://www.nba.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit NBA.com"
      className="mx-auto flex items-center justify-center rounded-lg bg-black px-4 py-2 font-mono text-2xl text-red-600 cursor-pointer transition-all duration-200 hover:brightness-125 hover:shadow-[0_0_8px_2px_rgba(255,0,0,0.4)]"
      style={{ backgroundColor: "#000000", color: "#ff0000" }}
    >
      {hh}
      <span
        data-testid="clock-colon"
        style={{ visibility: colonVisible ? "visible" : "hidden", display: "inline-block", width: "0.5ch" }}
      >
        :
      </span>
      {mm}
      <span
        data-testid="clock-colon"
        style={{ visibility: colonVisible ? "visible" : "hidden", display: "inline-block", width: "0.5ch" }}
      >
        :
      </span>
      {ss}
    </a>
  );
}
