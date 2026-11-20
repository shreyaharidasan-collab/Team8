import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CoordinatorDashboard } from "@/components/pulse/CoordinatorDashboard";
import { type CheckInPayload, StudentCheckIn } from "@/components/pulse/StudentCheckIn";
import { TopNav, type View } from "@/components/pulse/TopNav";
import { type AtRiskRow, BASELINE_AT_RISK, SEED_ALERTS, type Submission, buildSubmission } from "@/lib/pulse";

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

const STUDENT = { name: "Jordan Patel", department: "T&O" as const, departmentLabel: "T&O - Software Engineering" };

function Index() {
  const [view, setView] = useState<View>("student");
  const [alerts, setAlerts] = useState<AtRiskRow[]>(SEED_ALERTS);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const handleCheckIn = (p: CheckInPayload) => {
    const { submission, alert } = buildSubmission({
      ...p,
      ...STUDENT,
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

  const alertCount = BASELINE_AT_RISK + alerts.filter((a) => a.isNew).length;

  return (
    <div className="min-h-screen">
      <TopNav view={view} onChange={setView} alertCount={alertCount} />
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
