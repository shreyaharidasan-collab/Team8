import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CoordinatorDashboard } from "@/components/pulse/CoordinatorDashboard";
import { type CheckInPayload, StudentCheckIn } from "@/components/pulse/StudentCheckIn";
import { TopNav, type View } from "@/components/pulse/TopNav";
import {
  type AtRiskRow,
  DEPARTMENT_OPTIONS,
  SEED_ALERTS,
  type Submission,
  buildSubmission,
  countAtRisk,
} from "@/lib/pulse";
import { clearPulseState, loadPulseState, savePulseState } from "@/lib/pulse-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RBC Pulse — Weekly Co-op Check-Ins & Retention Insights" },
      {
        name: "description",
        content:
          "RBC Pulse gives Early Talent co-ops a 30-second weekly check-in and coordinators a live command center for sentiment and at-risk alerts.",
      },
      { property: "og:title", content: "RBC Pulse — Early Talent & Co-op Check-Ins" },
      {
        property: "og:description",
        content: "30-second weekly pulse check-ins for co-ops, live retention insights for coordinators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STUDENT = { name: "Jordan Patel" };
const DEFAULT_DEPARTMENT = DEPARTMENT_OPTIONS[0]!;

function Index() {
  const [view, setView] = useState<View>("student");
  const [alerts, setAlerts] = useState<AtRiskRow[]>(SEED_ALERTS);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Restore demo state after mount (keeps SSR markup and first client render identical).
  useEffect(() => {
    const saved = loadPulseState();
    if (saved) {
      setAlerts(saved.alerts);
      setSubmissions(saved.submissions);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePulseState({ alerts, submissions });
  }, [hydrated, alerts, submissions]);

  const handleReset = () => {
    clearPulseState();
    setAlerts(SEED_ALERTS);
    setSubmissions([]);
    toast.success("Demo data reset", { description: "Restored the default mock data." });
  };

  const handleCheckIn = (p: CheckInPayload) => {
    const dept = p.department ?? DEFAULT_DEPARTMENT;
    const { submission, alert } = buildSubmission({
      scores: p.scores,
      feedback: p.feedback,
      anonymous: p.anonymous,
      name: STUDENT.name,
      department: dept.department,
      departmentLabel: dept.label,
      anonId: 500 + Math.floor(Math.random() * 400),
    });
    setSubmissions((s) => [submission, ...s]);
    if (alert) setAlerts((a) => [alert, ...a]);

    toast.success("Weekly Pulse sent!", {
      description: alert
        ? `Thanks${p.anonymous ? "" : `, ${STUDENT.name.split(" ")[0]}`} — Early Talent has been alerted and will follow up.`
        : `Thanks${p.anonymous ? "" : `, ${STUDENT.name.split(" ")[0]}`} — your check-in is now live for your coordinator.`,
      action: { label: "View dashboard", onClick: () => setView("coordinator") },
    });
  };

  const handleIntervention = (row: AtRiskRow) => {
    setAlerts((a) => a.map((r) => (r.id === row.id ? { ...r, status: "sent" } : r)));
    toast.success("Intervention sent", {
      description: row.anonymous
        ? `Encrypted blind notification delivered to ${row.name}.`
        : `Playbook kicked off for ${row.name}.`,
    });
  };

  const alertCount = countAtRisk(alerts);

  return (
    <div className="min-h-screen">
      <TopNav view={view} onChange={setView} alertCount={alertCount} onReset={handleReset} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {view === "student" ? (
          <StudentCheckIn onSubmit={handleCheckIn} />
        ) : (
          <CoordinatorDashboard alerts={alerts} submissions={submissions} onSendIntervention={handleIntervention} />
        )}
      </main>
    </div>
  );
}
