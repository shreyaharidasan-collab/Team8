import { useState } from "react";
import { Lock, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, DEPARTMENT_OPTIONS, type Department, type Scores, scoreEmoji, scoreLabel } from "@/lib/pulse";
import { cn } from "@/lib/utils";

const INITIAL: Scores = { mentorship: 3, onboarding: 3, team: 3, career: 3 };

export interface CheckInPayload {
  scores: Scores;
  feedback: string;
  anonymous: boolean;
  /** Department tag chosen on the form. Optional so existing callers keep working. */
  department?: { department: Department; label: string };
}

export function StudentCheckIn({ onSubmit }: { onSubmit: (p: CheckInPayload) => void }) {
  const [scores, setScores] = useState<Scores>(INITIAL);
  const [feedback, setFeedback] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [sending, setSending] = useState(false);
  const [deptKey, setDeptKey] = useState<Department>(DEPARTMENT_OPTIONS[0]!.department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      const dept = DEPARTMENT_OPTIONS.find((d) => d.department === deptKey) ?? DEPARTMENT_OPTIONS[0]!;
      onSubmit({ scores, feedback, anonymous, department: dept });
      setScores(INITIAL);
      setFeedback("");
      setSending(false);
    }, 450);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-[2rem] bg-card shadow-phone"
      >
        <div className="relative bg-brand-gradient px-6 pb-7 pt-5 text-primary-foreground">
          <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-primary-foreground/25" />
          <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
            {DEPARTMENT_OPTIONS.find((d) => d.department === deptKey)?.label}
          </span>
          <h1 className="mt-3 text-2xl font-bold">Weekly Pulse Check-In</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">Takes 30 seconds • Week 6 of 16</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/20">
            <div className="h-full w-[37.5%] rounded-full bg-accent" />
          </div>
        </div>

        <div className="space-y-4 px-5 py-6">
          <div>
            <label htmlFor="department" className="text-sm font-bold">
              Your department
            </label>
            <Select value={deptKey} onValueChange={(v) => setDeptKey(v as Department)}>
              <SelectTrigger id="department" className="mt-2 h-11 rounded-xl bg-background/60 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <SelectItem key={d.department} value={d.department}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {CATEGORIES.map((c) => {
            const value = scores[c.key];
            return (
              <div key={c.key} className="rounded-2xl border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">{c.label}</div>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{c.prompt}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-card px-2 py-1 shadow-card">
                    <span key={value} className="text-xl leading-none animate-in zoom-in-50 duration-200" aria-hidden>
                      {scoreEmoji(value)}
                    </span>
                    <span className="tabular font-display text-lg font-bold text-primary">{value}</span>
                  </div>
                </div>
                <Slider
                  className="mt-4"
                  min={1}
                  max={5}
                  step={1}
                  value={[value]}
                  onValueChange={([v]) => setScores((s) => ({ ...s, [c.key]: v ?? 3 }))}
                  aria-label={c.label}
                />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>1</span>
                  <span className="text-primary">{scoreLabel(value)}</span>
                  <span>5</span>
                </div>
              </div>
            );
          })}

          <div>
            <label htmlFor="feedback" className="text-sm font-bold">
              What was your biggest blocker or quick win this week?
            </label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Be honest—we're listening..."
              className="mt-2 min-h-24 resize-none rounded-xl bg-background/60 text-sm"
              maxLength={500}
            />
          </div>

          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
              anonymous ? "border-primary/30 bg-primary-soft" : "bg-background/60",
            )}
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-card">
              {anonymous ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <label htmlFor="anon" className="text-sm font-bold">
                Submit Anonymously
              </label>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Hides your name while keeping your department tag so Early Talent can fix team-wide blockers.
              </p>
            </div>
            <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} className="mt-1" />
          </div>

          <Button type="submit" variant="brand" size="xl" className="w-full" disabled={sending}>
            {sending ? "Sending…" : "Send Weekly Pulse"}
            {!sending && <Send />}
          </Button>
        </div>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Your responses are encrypted and only shared as you choose.
      </p>
    </div>
  );
}
