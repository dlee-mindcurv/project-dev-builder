"use client";

import DigitalClock from "./DigitalClock";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="flex flex-col items-center gap-4 w-full pt-4">
      <button
        onClick={scrollToTop}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
      >
        Back to Top
      </button>
      <DigitalClock />
      <div className="flex gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>
    </footer>
  );
}
