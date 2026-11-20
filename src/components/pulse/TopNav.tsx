import { Activity, LayoutDashboard, RotateCcw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type View = "student" | "coordinator";

const VIEWS: { key: View; label: string; short: string; icon: typeof Smartphone }[] = [
  { key: "student", label: "Student Mobile Check-In", short: "Check-In", icon: Smartphone },
  { key: "coordinator", label: "Coordinator Command Center", short: "Command Center", icon: LayoutDashboard },
];

function ViewSwitcher({ view, onChange, className }: { view: View; onChange: (v: View) => void; className?: string }) {
  return (
    <div
      role="tablist"
      aria-label="Switch view"
      className={cn("inline-flex rounded-full border bg-muted p-1", className)}
    >
      {VIEWS.map(({ key, label, short, icon: Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-all sm:px-4 sm:text-sm",
              active
                ? "bg-primary text-primary-foreground shadow-lift"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden lg:inline">{label}</span>
            <span className="lg:hidden">{short}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TopNav({
  view,
  onChange,
  alertCount,
  onReset,
}: {
  view: View;
  onChange: (v: View) => void;
  alertCount: number;
  /** Optional: when provided, shows a "Reset Demo Data" button. */
  onReset?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient shadow-lift">
            <Activity className="h-5 w-5 text-accent" strokeWidth={2.75} />
          </div>
          <div className="leading-none">
            <div className="font-display text-base font-bold text-primary-deep">
              RBC <span className="text-primary">Pulse</span>
            </div>
            <div className="mt-0.5 hidden text-[11px] font-medium text-muted-foreground sm:block">
              Early Talent & Co-op
            </div>
          </div>
        </div>

        <ViewSwitcher view={view} onChange={onChange} className="hidden md:inline-flex" />

        <div className="flex items-center gap-3">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Clear saved check-ins and restore default mock data"
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Demo Data</span>
              <span className="sr-only sm:hidden">Reset Demo Data</span>
            </button>
          )}
          {view === "coordinator" && alertCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-destructive-soft px-2.5 py-1 text-xs font-semibold text-destructive sm:inline-flex">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-destructive text-destructive" />
              {alertCount} alerts
            </span>
          )}
          <div className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-1 sm:pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {view === "student" ? "JP" : "SR"}
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-xs font-semibold">{view === "student" ? "Jordan Patel" : "Sarah Reid"}</div>
              <div className="text-[11px] text-muted-foreground">
                {view === "student" ? "Co-op Student" : "Early Talent Lead"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t px-4 py-2 md:hidden">
        <ViewSwitcher view={view} onChange={onChange} className="flex w-full" />
      </div>
    </header>
  );
}
