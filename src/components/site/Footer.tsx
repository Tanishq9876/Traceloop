import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10 mt-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <Logo />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Traceloop. Understand the flow behind every algorithm.
        </p>
      </div>
    </footer>
  );
}
