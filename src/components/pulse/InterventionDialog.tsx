import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AtRiskRow, playbookFor } from "@/lib/pulse";

export function InterventionDialog({
  row,
  onClose,
  onConfirm,
}: {
  row: AtRiskRow | null;
  onClose: () => void;
  onConfirm: (row: AtRiskRow) => void;
}) {
  const playbook = row ? playbookFor(row) : null;
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        {row && playbook && (
          <>
            <DialogHeader>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
                <Sparkles className="h-3 w-3" /> AI-recommended playbook
              </span>
              <DialogTitle className="pt-2 font-display text-xl">{playbook.title}</DialogTitle>
              <DialogDescription>{playbook.summary}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">{row.name}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">{row.departmentLabel}</span>
              <span className="rounded-full bg-destructive-soft px-2.5 py-1 font-semibold text-destructive">
                Risk {row.riskScore}/100
              </span>
            </div>

            <ol className="space-y-3">
              {playbook.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-snug">{step}</span>
                </li>
              ))}
            </ol>

            {playbook.privacy && (
              <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-xs font-medium text-primary">
                <Lock className="h-4 w-4 shrink-0" />
                {playbook.privacy}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="brand" onClick={() => onConfirm(row)}>
                <Check /> Send Intervention
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
