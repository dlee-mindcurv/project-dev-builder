"use client";

import { useState, useEffect } from "react";

interface TimeState {
  hours: string;
  minutes: string;
  seconds: string;
  showColons: boolean;
}

function getTimeState(): TimeState {
  const now = new Date();
  const seconds = now.getSeconds();
  return {
    hours: String(now.getHours()).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    showColons: seconds % 2 === 0,
  };
}

export default function DigitalClock() {
  const [timeState, setTimeState] = useState<TimeState>(getTimeState);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeState(getTimeState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const colonStyle: React.CSSProperties = {
    display: "inline-block",
    width: "0.5ch",
    textAlign: "center",
    visibility: timeState.showColons ? "visible" : "hidden",
  };

  return (
    <a
      href="https://www.nba.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit NBA.com"
      className="flex justify-center"
    >
      <div
        className="font-mono text-2xl rounded-lg px-4 py-2 cursor-pointer hover:brightness-125 hover:shadow-[0_0_10px_#ff0000] transition-all"
        style={{
          backgroundColor: "#000000",
          color: "#ff0000",
        }}
      >
        {timeState.hours}
        <span data-testid="clock-colon" style={colonStyle}>:</span>
        {timeState.minutes}
        <span data-testid="clock-colon" style={colonStyle}>:</span>
        {timeState.seconds}
      </div>
    </a>
  );
}
