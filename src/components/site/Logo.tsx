import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group ${className}`}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-indigo-700 shadow-[0_0_24px_-6px_var(--color-primary)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17c4-10 12 10 16 0" />
          <circle cx="4" cy="17" r="1.4" fill="currentColor" />
          <circle cx="20" cy="17" r="1.4" fill="currentColor" />
        </svg>
      </span>
      <span className="font-semibold tracking-tight text-foreground">
        Traceloop
      </span>
    </Link>
  );
}
