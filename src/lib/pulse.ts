export type Category = "mentorship" | "onboarding" | "team" | "career";

export const CATEGORIES: { key: Category; label: string; prompt: string }[] = [
  {
    key: "mentorship",
    label: "Mentorship",
    prompt: "My mentor/manager is accessible and gives clear guidance",
  },
  {
    key: "onboarding",
    label: "Onboarding",
    prompt: "I have the tools, access, and context to be productive",
  },
  { key: "team", label: "Team Dynamics", prompt: "I feel included, supported, and valued by my team" },
  {
    key: "career",
    label: "Career Development",
    prompt: "I'm working on meaningful tasks aligned to my goals",
  },
];

export type Scores = Record<Category, number>;

export type Department = "T&O" | "Cyber Security" | "Capital Markets" | "Digital";
export const DEPARTMENTS: Department[] = ["T&O", "Cyber Security", "Capital Markets", "Digital"];

/** Options shown in the student check-in selector; `label` is the tag stored on submissions/alerts. */
export const DEPARTMENT_OPTIONS: { department: Department; label: string }[] = [
  { department: "T&O", label: "T&O - Software Engineering" },
  { department: "Cyber Security", label: "Cyber Security" },
  { department: "Capital Markets", label: "Capital Markets" },
  { department: "Digital", label: "Digital" },
];

export type RiskLevel = "High" | "Medium" | "Low";

export type ActionType = "relay" | "escalate" | "stretch" | "mentor" | "team";

export interface AtRiskRow {
  id: string;
  name: string;
  anonymous: boolean;
  department: Department;
  departmentLabel: string;
  riskScore: number;
  riskLevel: RiskLevel;
  trend: string;
  keywords: string;
  action: ActionType;
  status: "open" | "sent";
  isNew?: boolean;
}

export interface Submission {
  id: string;
  name: string;
  anonymous: boolean;
  department: Department;
  departmentLabel: string;
  scores: Scores;
  feedback: string;
  riskScore: number;
  riskLevel: RiskLevel;
  submittedAt: Date;
}

/** Emoji for a 1–5 score: 😞 → 😄 */
export function scoreEmoji(score: number): string {
  return ["😞", "😕", "😐", "🙂", "😄"][Math.min(5, Math.max(1, Math.round(score))) - 1] ?? "😐";
}

export function scoreLabel(score: number): string {
  return ["Struggling", "Not great", "Okay", "Good", "Thriving"][
    Math.min(5, Math.max(1, Math.round(score))) - 1
  ] ?? "Okay";
}

/**
 * Risk 0–100: 70% weighted on the average score, 30% on the lowest score,
 * so one collapsing category still raises a flag.
 */
export function computeRisk(scores: Scores): number {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const risk = ((5 - avg) / 4) * 70 + ((5 - min) / 4) * 30;
  return Math.round(Math.min(100, Math.max(0, risk)));
}

/** High ≥ 80, Medium ≥ 60, otherwise Low. */
export function riskLevel(score: number): RiskLevel {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}

export function lowestCategory(scores: Scores): Category {
  return CATEGORIES.reduce((low, c) => (scores[c.key] < scores[low] ? c.key : low), "mentorship" as Category);
}

export function actionFor(category: Category, anonymous: boolean): ActionType {
  switch (category) {
    case "mentorship":
      return anonymous ? "relay" : "mentor";
    case "onboarding":
      return "escalate";
    case "career":
      return "stretch";
    case "team":
      return anonymous ? "relay" : "team";
  }
}

export const ACTION_LABELS: Record<ActionType, string> = {
  relay: "Send Opt-In 1:1 Relay",
  escalate: "Escalate IT + Manager Sync",
  stretch: "Suggest Stretch Project",
  mentor: "Schedule Mentor Reset",
  team: "Facilitate Team Connect",
};

const KEYWORD_RULES: { match: RegExp; tag: string }[] = [
  { match: /vpn|laptop|access|repo|permission|credential|login|tool/i, tag: "access blockers" },
  { match: /isolat|alone|lonely|left out|ignored/i, tag: "isolated" },
  { match: /unclear|confus|no direction|don'?t know what/i, tag: "unclear tasks" },
  { match: /1:1|one on one|1-1|mentor|manager/i, tag: "mentor gaps" },
  { match: /admin|repetitive|boring|busywork|spreadsheet/i, tag: "repetitive work" },
  { match: /sprint|deadline|expectation/i, tag: "unclear expectations" },
  { match: /overwhelm|stress|burn|too much|overtime/i, tag: "workload strain" },
  { match: /win|shipped|launched|great|proud|learned/i, tag: "quick win" },
];

/** Lightweight on-device keyword extraction used for the "AI Blocker Keywords" column. */
export function extractKeywords(text: string): string[] {
  const tags = KEYWORD_RULES.filter((r) => r.match.test(text)).map((r) => r.tag);
  return Array.from(new Set(tags)).slice(0, 3);
}

export function buildSubmission(input: {
  scores: Scores;
  feedback: string;
  anonymous: boolean;
  name: string;
  department: Department;
  departmentLabel: string;
  anonId: number;
}): { submission: Submission; alert: AtRiskRow | null } {
  const riskScore = computeRisk(input.scores);
  const level = riskLevel(riskScore);
  const displayName = input.anonymous ? `Anonymous #${input.anonId}` : input.name;
  const id = `sub-${Date.now()}-${input.anonId}`;
  const submission: Submission = {
    id,
    name: displayName,
    anonymous: input.anonymous,
    department: input.department,
    departmentLabel: input.departmentLabel,
    scores: input.scores,
    feedback: input.feedback.trim(),
    riskScore,
    riskLevel: level,
    submittedAt: new Date(),
  };

  if (level === "Low") return { submission, alert: null };

  const low = lowestCategory(input.scores);
  const lowLabel = CATEGORIES.find((c) => c.key === low)?.label ?? "Mentorship";
  const keywords = extractKeywords(input.feedback);
  const alert: AtRiskRow = {
    id,
    name: displayName,
    anonymous: input.anonymous,
    department: input.department,
    departmentLabel: input.departmentLabel,
    riskScore,
    riskLevel: level,
    trend: `${lowLabel} at ${input.scores[low].toFixed(1)} this week`,
    keywords: keywords.length ? keywords.join(", ") : input.feedback.trim().slice(0, 48) || "No written feedback",
    action: actionFor(low, input.anonymous),
    status: "open",
    isNew: true,
  };
  return { submission, alert };
}

export const SEED_ALERTS: AtRiskRow[] = [
  {
    id: "seed-402",
    name: "Anonymous #402",
    anonymous: true,
    department: "Cyber Security",
    departmentLabel: "Cyber Security",
    riskScore: 91,
    riskLevel: "High",
    trend: "Mentorship dropped 4.5 → 2.0",
    keywords: "Isolated, unclear tasks, no 1:1s",
    action: "relay",
    status: "open",
  },
  {
    id: "seed-maya",
    name: "Maya Lin",
    anonymous: false,
    department: "T&O",
    departmentLabel: "T&O Engineering",
    riskScore: 86,
    riskLevel: "High",
    trend: "Onboarding stuck at 1.5",
    keywords: "Missing repo access, blocked 2 weeks",
    action: "escalate",
    status: "open",
  },
  {
    id: "seed-118",
    name: "Anonymous #118",
    anonymous: true,
    department: "Capital Markets",
    departmentLabel: "Capital Markets",
    riskScore: 72,
    riskLevel: "Medium",
    trend: "Career Dev dropped 4.0 → 2.5",
    keywords: "Repetitive admin work",
    action: "stretch",
    status: "open",
  },
  {
    id: "seed-233",
    name: "Anonymous #233",
    anonymous: true,
    department: "Digital",
    departmentLabel: "Digital",
    riskScore: 68,
    riskLevel: "Medium",
    trend: "Team Dynamics dropped 4.2 → 2.8",
    keywords: "Left out of standups",
    action: "relay",
    status: "open",
  },
  {
    id: "seed-sam",
    name: "Sam Okafor",
    anonymous: false,
    department: "Cyber Security",
    departmentLabel: "Cyber Security",
    riskScore: 64,
    riskLevel: "Medium",
    trend: "Mentorship at 2.5 this week",
    keywords: "Mentor on leave, no backup",
    action: "mentor",
    status: "open",
  },
  {
    id: "seed-341",
    name: "Anonymous #341",
    anonymous: true,
    department: "T&O",
    departmentLabel: "T&O - Software Engineering",
    riskScore: 61,
    riskLevel: "Medium",
    trend: "Onboarding dropped 3.8 → 2.6",
    keywords: "Laptop/VPN access delays",
    action: "escalate",
    status: "open",
  },
];

/** Cohort-wide baseline averages (out of 5.0) and the response count behind them. */
export const BASELINE_AVERAGES: Scores = { mentorship: 4.3, team: 4.1, career: 3.9, onboarding: 3.2 };
export const BASELINE_RESPONSES = 400;
export const ACTIVE_COOPS = 450;

export function blendedAverages(submissions: Submission[]): Scores {
  const total = BASELINE_RESPONSES + submissions.length;
  const out = { ...BASELINE_AVERAGES };
  for (const c of CATEGORIES) {
    const sum = BASELINE_AVERAGES[c.key] * BASELINE_RESPONSES + submissions.reduce((a, s) => a + s.scores[c.key], 0);
    out[c.key] = sum / total;
  }
  return out;
}

export type DeptHealth = "Healthy" | "Watch" | "Action Needed";
export interface DeptHealthRow {
  department: Department;
  label: string;
  health: DeptHealth;
  sentiment: number;
  note: string;
}

/** Baseline % positive per department (and the response weight behind it) before live check-ins. */
const DEPT_BASELINE: Record<Department, { label: string; sentiment: number; note: string }> = {
  Digital: { label: "Digital", sentiment: 91, note: "Strong mentor coverage" },
  "T&O": { label: "T&O", sentiment: 79, note: "Onboarding access lag" },
  "Capital Markets": { label: "Capital Markets", sentiment: 74, note: "Task variety dipping" },
  "Cyber Security": { label: "Cyber Security", sentiment: 58, note: "1:1 cadence missed" },
};
const DEPT_BASELINE_RESPONSES = 100;

export function averageScore(scores: Scores): number {
  return Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
}

export function isPositive(s: Submission): boolean {
  return averageScore(s.scores) >= 3.5;
}

export function healthFor(sentiment: number): DeptHealth {
  if (sentiment >= 85) return "Healthy";
  if (sentiment >= 70) return "Watch";
  return "Action Needed";
}

/** Department heatmap: baseline sentiment blended with this session's check-ins. */
export function deptHealth(submissions: Submission[]): DeptHealthRow[] {
  return DEPARTMENTS.map((department) => {
    const base = DEPT_BASELINE[department];
    const mine = submissions.filter((s) => s.department === department);
    const positive = mine.filter(isPositive).length;
    const sentiment = Math.round(
      (base.sentiment * DEPT_BASELINE_RESPONSES + positive * 100) / (DEPT_BASELINE_RESPONSES + mine.length),
    );
    return { department, label: base.label, health: healthFor(sentiment), sentiment, note: base.note };
  }).sort((a, b) => b.sentiment - a.sentiment);
}

/** Cohort % positive, blended with live check-ins. */
export function cohortPositive(submissions: Submission[]): number {
  const positive = submissions.filter(isPositive).length;
  return (0.82 * BASELINE_RESPONSES + positive) / (BASELINE_RESPONSES + submissions.length);
}

/** Single source of truth for the At-Risk Alerts KPI and nav badge: exactly the rows in the retention table. */
export function countAtRisk(alerts: AtRiskRow[]): number {
  return alerts.length;
}

/** Baseline blocker mentions (tag → count) before live check-ins. */
const BASELINE_BLOCKERS: Record<string, number> = {
  "access blockers": 38,
  "unclear expectations": 24,
  "mentor gaps": 14,
  isolated: 10,
  "repetitive work": 8,
  "workload strain": 6,
};
const BLOCKER_LABELS: Record<string, string> = {
  "access blockers": "Laptop/VPN access delays",
  "unclear expectations": "Unclear sprint expectations",
  "mentor gaps": "Mentor 1:1 gaps",
  isolated: "Feeling isolated",
  "repetitive work": "Repetitive admin work",
  "workload strain": "Workload strain",
  "unclear tasks": "Unclear tasks",
};

/** Top systemic blockers by share of mentions, blending baseline with new feedback. Positive tags are ignored. */
export function topBlockers(submissions: Submission[], limit = 3): { tag: string; label: string; share: number }[] {
  const counts: Record<string, number> = { ...BASELINE_BLOCKERS };
  for (const s of submissions) {
    for (const tag of extractKeywords(s.feedback)) {
      if (tag === "quick win") continue;
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, n]) => ({ tag, label: BLOCKER_LABELS[tag] ?? tag, share: Math.round((n / total) * 100) }));
}

export interface Playbook {
  title: string;
  summary: string;
  steps: string[];
  privacy?: string | undefined;
}

export function playbookFor(row: AtRiskRow): Playbook {
  switch (row.action) {
    case "relay":
      return {
        title: "Confidential Opt-In 1:1 Relay",
        summary: `Flag for ${row.name}: ${row.trend}. Reach out without breaking anonymity.`,
        steps: [
          "Send an encrypted blind notification through RBC Pulse — the student's identity is never revealed to you.",
          "Invite them to opt into a confidential 20-minute Early Talent coffee chat at a time they choose.",
          `Nudge the ${row.departmentLabel} team lead to restore a weekly 1:1 cadence for all co-ops (team-wide, no names).`,
          "Re-check this student's pulse next week and close the loop automatically.",
        ],
        privacy: "Identity stays sealed unless the student chooses to share it.",
      };
    case "escalate":
      return {
        title: "IT Escalation + Manager Sync",
        summary: `${row.name} is blocked on access: ${row.keywords}.`,
        steps: [
          "Open a priority IT ticket for repo and environment access, tagged Early Talent SLA (48h).",
          "Book a 15-minute sync with the hiring manager to agree on interim tasks while access is restored.",
          "Pair the student with a buddy developer for shadowing until unblocked.",
          "Confirm resolution with the student in next week's pulse.",
        ],
      };
    case "stretch":
      return {
        title: "Stretch Project Suggestion",
        summary: `${row.name}'s career growth is slipping: ${row.trend}.`,
        steps: [
          "Share 3 curated stretch projects from the cross-team Early Talent project board.",
          "Prompt the manager to rebalance repetitive admin work toward goal-aligned tasks.",
          "Offer an optional career coaching session with an RBC alumni mentor.",
        ],
        privacy: row.anonymous ? "Suggestions are delivered blind — no identity revealed." : undefined,
      };
    case "mentor":
      return {
        title: "Mentor Reset",
        summary: `${row.name} reports low mentor accessibility: ${row.trend}.`,
        steps: [
          "Ask the mentor to schedule a recurring weekly 30-minute 1:1.",
          "Share the Early Talent mentor guide with expectations for co-op support.",
          "Offer a secondary mentor from the same department if availability stays limited.",
        ],
      };
    case "team":
      return {
        title: "Team Connect",
        summary: `${row.name} feels less included on their team: ${row.trend}.`,
        steps: [
          "Suggest a low-key team coffee or lunch-and-learn hosted by the team lead.",
          "Add the student to the cohort's peer circle for cross-team connection.",
          "Follow up in two weeks via pulse.",
        ],
      };
  }
}
