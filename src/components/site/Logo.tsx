import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group ${className}`}>
      <img
        src={logoUrl}
        alt="Traceloop"
        className="h-7 w-7 object-contain dark:invert"
      />
      <span className="font-semibold tracking-tight text-foreground">
        Traceloop
      </span>
    </Link>
  );
}
