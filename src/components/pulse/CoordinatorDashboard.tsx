import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Radio,
  Smile,
  Sparkles,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ACTION_LABELS,
  ACTIVE_COOPS,
  BASELINE_AT_RISK,
  BASELINE_RESPONSES,
  type AtRiskRow,
  type Department,
  type DeptHealth,
  DEPARTMENTS,
  DEPT_HEALTH,
  type RiskLevel,
  type Submission,
  blendedAverages,
  scoreEmoji,
} from "@/lib/pulse";
import { cn } from "@/lib/utils";
import { InterventionDialog } from "./InterventionDialog";

type DeptFilter = "all" | Department;
type RiskFilter = "all" | Exclude<RiskLevel, "Low">;

const HEALTH_ORDER = [
  { key: "mentorship", label: "Mentorship" },
  { key: "team", label: "Team Dynamics" },
  { key: "career", label: "Career Development" },
  { key: "onboarding", label: "Onboarding" },
] as const;

const HEALTH_STYLE: Record<DeptHealth, string> = {
  Healthy: "bg-success-soft text-success border-success/25",
  Watch: "bg-warning-soft text-warning-foreground border-warning/30",
  "Action Needed": "bg-destructive-soft text-destructive border-destructive/25",
};
const HEALTH_DOT: Record<DeptHealth, string> = {
  Healthy: "bg-success",
  Watch: "bg-warning",
  "Action Needed": "bg-destructive",
};

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border bg-card p-5 shadow-card sm:p-6", className)}>{children}</section>;
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  className?: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 sm:min-w-44", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-10 rounded-xl bg-card font-semibold" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold",
        level === "High" ? "bg-destructive-soft text-destructive" : "bg-warning-soft text-warning-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", level === "High" ? "bg-destructive" : "bg-warning")} />
      {level} <span className="tabular font-semibold opacity-80">({score}/100)</span>
    </span>
  );
}

function ActionCell({ row, onOpen }: { row: AtRiskRow; onOpen: (r: AtRiskRow) => void }) {
  if (row.status === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
        <CheckCircle2 className="h-3.5 w-3.5" /> Intervention Sent ✓
      </span>
    );
  }
  return (
    <Button size="sm" variant="soft" className="rounded-lg font-semibold" onClick={() => onOpen(row)}>
      {ACTION_LABELS[row.action]}
    </Button>
  );
}

export function CoordinatorDashboard({
  alerts,
  submissions,
  onSendIntervention,
}: {
  alerts: AtRiskRow[];
  submissions: Submission[];
  onSendIntervention: (row: AtRiskRow) => void;
}) {
  const [dept, setDept] = useState<DeptFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [cohort, setCohort] = useState("summer-2027");
  const [active, setActive] = useState<AtRiskRow | null>(null);

  const averages = useMemo(() => blendedAverages(submissions), [submissions]);
  const newAlerts = alerts.filter((a) => a.isNew).length;
  const atRisk = BASELINE_AT_RISK + newAlerts;
  const positive =
    (0.82 * BASELINE_RESPONSES +
      submissions.filter((s) => Object.values(s.scores).reduce((a, b) => a + b, 0) / 4 >= 3.5).length) /
    (BASELINE_RESPONSES + submissions.length);

  const rows = alerts
    .filter((a) => dept === "all" || a.department === dept)
    .filter((a) => risk === "all" || a.riskLevel === risk)
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.riskScore - a.riskScore);

  const heat = DEPT_HEALTH.filter((d) => dept === "all" || d.department === dept);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-success">
            <span className="pulse-dot h-2 w-2 rounded-full bg-success text-success" /> Live · Week 6 of 16
          </div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Coordinator Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time sentiment and retention risk across the Early Talent cohort.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <FilterSelect
            className="col-span-2"
            label="Cohort"
            value={cohort}
            onChange={setCohort}
            options={[{ value: "summer-2027", label: "Summer 2027" }]}
          />
          <FilterSelect<DeptFilter>
            label="Department"
            value={dept}
            onChange={setDept}
            options={[{ value: "all", label: "All Departments" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
          />
          <FilterSelect<RiskFilter>
            label="Risk Level"
            value={risk}
            onChange={setRisk}
            options={[
              { value: "all", label: "All" },
              { value: "High", label: "High Risk" },
              { value: "Medium", label: "Medium Risk" },
            ]}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">Active Co-ops</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="tabular mt-3 font-display text-3xl font-bold text-primary-deep">{ACTIVE_COOPS}</div>
          <div className="mt-1 text-xs text-muted-foreground">Summer 2027 cohort</div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">Weekly Participation</span>
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div className="tabular mt-3 font-display text-3xl font-bold text-primary-deep">89%</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-success">
            <ArrowUpRight className="h-3.5 w-3.5" /> +14% vs traditional surveys
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">Overall Cohort Sentiment</span>
            <Smile className="h-4 w-4 text-primary" />
          </div>
          <div className="tabular mt-3 font-display text-3xl font-bold text-primary-deep">
            {Math.round(positive * 100)}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Positive</div>
        </Card>
        <Card className="border-destructive/30 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">At-Risk Alerts</span>
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular font-display text-3xl font-bold text-destructive">{atRisk}</span>
            <span className="text-sm font-semibold text-destructive">Students</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {newAlerts > 0 ? (
              <span className="font-semibold text-destructive">+{newAlerts} from live check-ins</span>
            ) : (
              "Needs proactive outreach"
            )}
          </div>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Systemic Program Health</h2>
              <p className="text-sm text-muted-foreground">
                Average score out of 5.0 · {BASELINE_RESPONSES + submissions.length} responses
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {HEALTH_ORDER.map(({ key, label }) => {
              const v = averages[key];
              const flagged = v < 3.5;
              const tone = v >= 4 ? "bg-primary" : flagged ? "bg-warning" : "bg-accent";
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      {label}
                      {flagged && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-foreground">
                          Flagged
                        </span>
                      )}
                    </span>
                    <span className="tabular font-display font-bold">{v.toFixed(1)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", tone)}
                      style={{ width: `${(v / 5) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border border-dashed bg-background p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-extracted top systemic blockers
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 text-warning" /> Laptop/VPN access delays
                </span>
                <span className="text-xs text-muted-foreground">38% of mentions</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 text-warning" /> Unclear sprint expectations
                </span>
                <span className="text-xs text-muted-foreground">24% of mentions</span>
              </li>
            </ul>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold">Department Heatmap</h2>
          <p className="text-sm text-muted-foreground">Sentiment health this week</p>
          <div className="mt-5 space-y-3">
            {heat.map((d) => (
              <div key={d.department} className={cn("rounded-xl border p-4", HEALTH_STYLE[d.health])}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-foreground">{d.label}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-bold">
                    <span className={cn("h-2 w-2 rounded-full", HEALTH_DOT[d.health])} />
                    {d.health}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.note}</span>
                  <span className="tabular font-bold">{d.sentiment}% positive</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="p-0 sm:p-0">
        <div className="flex flex-col gap-1 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-4 w-4 text-primary" /> AI At-Risk Retention & Intervention
            </h2>
            <p className="text-sm text-muted-foreground">Ranked by retention risk · new check-ins appear instantly</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{rows.length} shown</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No students match these filters.</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Trend</th>
                    <th className="px-4 py-3">AI Blocker Keywords</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={cn("border-b last:border-0", r.isNew && "animate-row-flash")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              r.anonymous ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary",
                            )}
                          >
                            {r.anonymous ? "#" : r.name.split(" ").map((p) => p[0]).join("")}
                          </div>
                          <div>
                            <div className="font-semibold">{r.name}</div>
                            {r.isNew && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                New · just now
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{r.departmentLabel}</td>
                      <td className="px-4 py-4">
                        <RiskBadge level={r.riskLevel} score={r.riskScore} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />
                          {r.trend}
                        </span>
                      </td>
                      <td className="max-w-56 px-4 py-4 italic text-muted-foreground">"{r.keywords}"</td>
                      <td className="px-6 py-4 text-right">
                        <ActionCell row={r} onOpen={setActive} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet */}
            <div className="divide-y lg:hidden">
              {rows.map((r) => (
                <div key={r.id} className={cn("space-y-3 p-5", r.isNew && "animate-row-flash")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.departmentLabel}</div>
                    </div>
                    <RiskBadge level={r.riskLevel} score={r.riskScore} />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <TrendingDown className="h-4 w-4 shrink-0 text-destructive" /> {r.trend}
                  </div>
                  <div className="text-sm italic text-muted-foreground">"{r.keywords}"</div>
                  <ActionCell row={r} onOpen={setActive} />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {submissions.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold">Live Pulse Feed</h2>
          <p className="text-sm text-muted-foreground">Check-ins received this session</p>
          <ul className="mt-4 divide-y">
            {submissions.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {s.name} <span className="font-normal text-muted-foreground">· {s.departmentLabel}</span>
                  </div>
                  {s.feedback && <p className="truncate text-xs text-muted-foreground">"{s.feedback}"</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  {HEALTH_ORDER.map(({ key, label }) => (
                    <span key={key} title={label} className="tabular">
                      {scoreEmoji(s.scores[key])} {s.scores[key]}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <InterventionDialog
        row={active}
        onClose={() => setActive(null)}
        onConfirm={(r) => {
          onSendIntervention(r);
          setActive(null);
        }}
      />
    </div>
  );
}
