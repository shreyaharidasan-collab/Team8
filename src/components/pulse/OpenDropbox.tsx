import { useEffect, useState } from "react";
import { CheckCircle2, EyeOff, Inbox, MessageCircleHeart, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEPARTMENT_OPTIONS, DROPBOX_MAX_LENGTH, type Department } from "@/lib/pulse";
import { cn } from "@/lib/utils";

export interface DropboxPayload {
  message: string;
  followUp: boolean;
  anonymous: boolean;
  /** Name to show the coordinator when not anonymous. */
  name: string;
  department: { department: Department; label: string };
}

function ChoiceCard({
  value,
  selected,
  title,
  hint,
  icon,
}: {
  value: string;
  selected: boolean;
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label
      htmlFor={`opt-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
        selected ? "border-primary/40 bg-primary-soft" : "bg-background/60 hover:bg-muted/50",
      )}
    >
      <RadioGroupItem id={`opt-${value}`} value={value} className="mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-bold">
          {icon}
          {title}
        </div>
        {hint && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{hint}</p>}
      </div>
    </label>
  );
}

/** Always-available, unscheduled dropbox for venting, feedback or flagging anything outside the weekly check-in. */
export function OpenDropbox({
  onSubmit,
  defaultDepartment,
  defaultName = "Jordan Patel",
  onGoToDashboard,
}: {
  onSubmit: (p: DropboxPayload) => void;
  /** Pre-selected department (e.g. the student's last saved one). */
  defaultDepartment?: Department | undefined;
  defaultName?: string;
  onGoToDashboard?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [deptKey, setDeptKey] = useState<Department>(defaultDepartment ?? DEPARTMENT_OPTIONS[0]!.department);
  // The saved department loads from localStorage after mount, so follow it when it arrives.
  useEffect(() => {
    if (defaultDepartment) setDeptKey(defaultDepartment);
  }, [defaultDepartment]);
  const [followUp, setFollowUp] = useState<"share" | "follow">("share");
  const [anonymous, setAnonymous] = useState<"yes" | "no">("yes");
  const [name, setName] = useState(defaultName);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ followUp: boolean; anonymous: boolean } | null>(null);

  const canSend = message.trim().length > 0 && !sending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      const dept = DEPARTMENT_OPTIONS.find((d) => d.department === deptKey) ?? DEPARTMENT_OPTIONS[0]!;
      const wantsFollowUp = followUp === "follow";
      const isAnon = anonymous === "yes";
      onSubmit({ message, followUp: wantsFollowUp, anonymous: isAnon, name, department: dept });
      setSent({ followUp: wantsFollowUp, anonymous: isAnon });
      setMessage("");
      setFollowUp("share");
      setAnonymous("yes");
      setSending(false);
    }, 450);
  };

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-[2rem] bg-card p-8 text-center shadow-phone">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Thanks for sharing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent.followUp
              ? sent.anonymous
                ? "Your note is with Early Talent. Someone can reach out through the blind two-way relay without ever seeing who you are."
                : "Your note is with Early Talent and someone will follow up with you."
              : "Your note is with Early Talent. No follow-up needed — we just wanted you to be heard."}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" variant="brand" onClick={() => setSent(null)}>
              Submit another note
            </Button>
            {onGoToDashboard && (
              <Button type="button" variant="soft" onClick={onGoToDashboard}>
                Go to dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-[2rem] bg-card shadow-phone">
        <div className="bg-brand-gradient px-6 pb-7 pt-6 text-primary-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
            <Inbox className="h-3 w-3" /> Open Dropbox
          </span>
          <h1 className="mt-3 text-2xl font-bold">Anything on your mind?</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Always open — no survey, no score, no deadline.
          </p>
        </div>

        <div className="space-y-6 px-5 py-6">
          {/* Q1 */}
          <div>
            <label htmlFor="dropbox-message" className="text-sm font-bold">
              1. Do you have something to share with us?
            </label>
            <Textarea
              id="dropbox-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={DROPBOX_MAX_LENGTH}
              placeholder="Vent, share a win, flag a blocker, or tell us what's on your mind—no formatting or survey score needed..."
              className="mt-2 min-h-40 resize-y rounded-xl bg-background/60 text-sm"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Department (optional)</span>
                <Select value={deptKey} onValueChange={(v) => setDeptKey(v as Department)}>
                  <SelectTrigger className="h-8 w-auto gap-2 rounded-lg bg-card text-xs font-semibold" aria-label="Department">
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
              <span className="tabular text-xs text-muted-foreground">
                {message.length}/{DROPBOX_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Q2 */}
          <fieldset>
            <legend className="text-sm font-bold">
              2. Do you want someone to follow up or do you just want to share this?
            </legend>
            <RadioGroup
              value={followUp}
              onValueChange={(v) => setFollowUp(v as "share" | "follow")}
              className="mt-2"
              aria-label="Follow-up preference"
            >
              <ChoiceCard
                value="share"
                selected={followUp === "share"}
                title="Just sharing — no follow-up needed"
                hint="Logged as an informational note."
                icon={<MessageCircleHeart className="h-4 w-4 text-primary" />}
              />
              <ChoiceCard
                value="follow"
                selected={followUp === "follow"}
                title="Yes, I'd like someone to follow up"
                hint="Flags your note for coordinator outreach."
                icon={<Send className="h-4 w-4 text-primary" />}
              />
            </RadioGroup>
          </fieldset>

          {/* Q3 */}
          <fieldset>
            <legend className="text-sm font-bold">3. Do you want this to stay anonymous?</legend>
            <RadioGroup
              value={anonymous}
              onValueChange={(v) => setAnonymous(v as "yes" | "no")}
              className="mt-2 grid-cols-2"
              aria-label="Anonymity"
            >
              <ChoiceCard value="yes" selected={anonymous === "yes"} title="Yes (Anonymous)" icon={<EyeOff className="h-4 w-4 text-primary" />} />
              <ChoiceCard value="no" selected={anonymous === "no"} title="No (Include my name)" icon={<UserRound className="h-4 w-4 text-primary" />} />
            </RadioGroup>

            {anonymous === "yes" && followUp === "follow" && (
              <p className="mt-2 rounded-xl bg-primary-soft px-3 py-2 text-xs leading-snug text-muted-foreground">
                A coordinator can reach out through the blind two-way relay — your identity stays hidden.
              </p>
            )}
            {anonymous === "no" && (
              <div className="mt-3">
                <label htmlFor="dropbox-name" className="text-xs font-semibold text-muted-foreground">
                  Your name
                </label>
                <Input
                  id="dropbox-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  className="mt-1 h-10 rounded-xl bg-background/60"
                />
              </div>
            )}
          </fieldset>

          <Button type="submit" variant="brand" size="xl" className="w-full" disabled={!canSend}>
            {sending ? "Sending…" : "Send to Early Talent"}
            {!sending && <Send />}
          </Button>
        </div>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Not for emergencies. If you need urgent help, contact your manager or Employee Assistance.
      </p>
    </div>
  );
}
