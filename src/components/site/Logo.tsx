import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white ring-1 ring-border shadow-sm">
        <img
          src={logoUrl}
          alt="Traceloop"
          className="h-6 w-6 object-contain"
        />
      </span>
      <span className="font-semibold tracking-tight text-foreground">
        Traceloop
      </span>
    </Link>
  );
}
