import { type AtRiskRow, type Department, type DropboxNote, type Submission } from "./pulse";

const KEY = "rbc-relay:demo-state:v1";
const DEPT_KEY = "rbc-relay:last-department";

export interface PersistedPulseState {
  alerts: AtRiskRow[];
  submissions: Submission[];
  notes: DropboxNote[];
}

/** What loadPulseState returns: `notes` is null for state saved before the Open Dropbox existed. */
export type LoadedPulseState = Omit<PersistedPulseState, "notes"> & { notes: DropboxNote[] | null };

type Dated<T> = Omit<T, "submittedAt"> & { submittedAt: string };

/** Returns saved demo state, or null if none/unreadable (SSR, private mode, corrupt JSON). */
export function loadPulseState(): LoadedPulseState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      alerts?: AtRiskRow[];
      submissions?: Dated<Submission>[];
      notes?: Dated<DropboxNote>[];
    };
    if (!Array.isArray(parsed.alerts) || !Array.isArray(parsed.submissions)) return null;
    return {
      alerts: parsed.alerts,
      submissions: parsed.submissions.map((s) => ({ ...s, submittedAt: new Date(s.submittedAt) })),
      // `notes` is absent in state saved before the Open Dropbox existed.
      notes: Array.isArray(parsed.notes)
        ? parsed.notes.map((n) => ({ ...n, submittedAt: new Date(n.submittedAt) }))
        : null,
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

export function loadLastDepartment(): Department | null {
  try {
    return window.localStorage.getItem(DEPT_KEY) as Department | null;
  } catch {
    return null;
  }
}

export function saveLastDepartment(department: Department): void {
  try {
    window.localStorage.setItem(DEPT_KEY, department);
  } catch {
    /* ignore */
  }
}

/** Clears every RBC Relay demo override (state + remembered department). */
export function clearPulseState(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(DEPT_KEY);
  } catch {
    /* ignore */
  }
}
