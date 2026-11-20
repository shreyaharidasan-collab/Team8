import { type AtRiskRow, type Submission } from "./pulse";

const KEY = "rbc-pulse:demo-state:v1";

export interface PersistedPulseState {
  alerts: AtRiskRow[];
  submissions: Submission[];
}

/** Returns saved demo state, or null if none/unreadable (SSR, private mode, corrupt JSON). */
export function loadPulseState(): PersistedPulseState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { alerts?: AtRiskRow[]; submissions?: (Submission & { submittedAt: string })[] };
    if (!Array.isArray(parsed.alerts) || !Array.isArray(parsed.submissions)) return null;
    return {
      alerts: parsed.alerts,
      submissions: parsed.submissions.map((s) => ({ ...s, submittedAt: new Date(s.submittedAt) })),
    };
  } catch {
    return null;
  }
}

export function savePulseState(state: PersistedPulseState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable or full — demo keeps working in memory */
  }
}

export function clearPulseState(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
