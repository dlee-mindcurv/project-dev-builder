import DigitalClock from "@/components/DigitalClock";

export default function Footer() {
  return (
    <footer className="flex w-full flex-col items-center gap-4 py-6">
      {/* Back to Top button */}
      <a
        href="#"
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
      >
        Back to Top
      </a>

      {/* Digital Clock */}
      <DigitalClock />

      {/* Decorative dots */}
      <div className="flex gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      </div>
    </footer>
  );
}
