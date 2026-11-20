import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CoordinatorDashboard } from "@/components/pulse/CoordinatorDashboard";
import { type DropboxPayload, OpenDropbox } from "@/components/pulse/OpenDropbox";
import { type CheckInPayload, StudentCheckIn } from "@/components/pulse/StudentCheckIn";
import { TopNav, type View } from "@/components/pulse/TopNav";
import {
  type AtRiskRow,
  DEPARTMENT_OPTIONS,
  type Department,
  SEED_ALERTS,
  SEED_NOTES,
  type Submission,
  buildDropboxNote,
  buildSubmission,
  countAtRisk,
  countOpenFollowUps,
  type DropboxNote,
} from "@/lib/pulse";
import { clearPulseState, loadLastDepartment, loadPulseState, saveLastDepartment, savePulseState } from "@/lib/pulse-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RBC Relay — Early Talent Support & Feedback Hub" },
      {
        name: "description",
        content:
          "RBC Relay is an Early Talent support and feedback hub: a 30-second weekly check-in, an always-open dropbox for co-ops, and a live command center for coordinators.",
      },
      { property: "og:title", content: "RBC Relay — Early Talent Support & Feedback Hub" },
      {
        property: "og:description",
        content: "Weekly check-ins and an open dropbox for co-ops, live retention insights for coordinators.",
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
  const [notes, setNotes] = useState<DropboxNote[]>(SEED_NOTES);
  const [lastDepartment, setLastDepartment] = useState<Department | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // Restore demo state after mount (keeps SSR markup and first client render identical).
  useEffect(() => {
    const saved = loadPulseState();
    if (saved) {
      setAlerts(saved.alerts);
      setSubmissions(saved.submissions);
      if (saved.notes) setNotes(saved.notes);
    }
    setLastDepartment(loadLastDepartment() ?? undefined);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePulseState({ alerts, submissions, notes });
  }, [hydrated, alerts, submissions, notes]);

  const handleReset = () => {
    clearPulseState();
    setAlerts(SEED_ALERTS);
    setSubmissions([]);
    setNotes(SEED_NOTES);
    setLastDepartment(undefined);
    toast.success("Demo data reset", { description: "Restored the default mock data." });
  };

  const handleCheckIn = (p: CheckInPayload) => {
    const dept = p.department ?? DEFAULT_DEPARTMENT;
    saveLastDepartment(dept.department);
    setLastDepartment(dept.department);
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

    toast.success("Weekly check-in sent!", {
      description: alert
        ? `Thanks${p.anonymous ? "" : `, ${STUDENT.name.split(" ")[0]}`} — Early Talent has been alerted and will follow up.`
        : `Thanks${p.anonymous ? "" : `, ${STUDENT.name.split(" ")[0]}`} — your check-in is now live for your coordinator.`,
      action: { label: "View dashboard", onClick: () => setView("coordinator") },
    });
  };

  const handleDropbox = (p: DropboxPayload) => {
    setNotes((n) => [
      buildDropboxNote({
        message: p.message,
        followUp: p.followUp,
        anonymous: p.anonymous,
        name: p.name,
        department: p.department.department,
        departmentLabel: p.department.label,
        anonId: 500 + Math.floor(Math.random() * 400),
      }),
      ...n,
    ]);
    saveLastDepartment(p.department.department);
    setLastDepartment(p.department.department);
  };

  const handleNoteFollowUp = (note: DropboxNote) => {
    setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, handled: true } : x)));
    toast.success("Follow-up sent", {
      description: note.anonymous
        ? `Blind relay message delivered to ${note.name}.`
        : `${note.name} has been contacted.`,
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
      <TopNav view={view} onChange={setView} alertCount={alertCount} onReset={handleReset} followUpCount={countOpenFollowUps(notes)} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {view === "student" ? (
          <StudentCheckIn onSubmit={handleCheckIn} />
        ) : view === "dropbox" ? (
          <OpenDropbox
            onSubmit={handleDropbox}
            defaultDepartment={lastDepartment}
            defaultName={STUDENT.name}
            onGoToDashboard={() => setView("coordinator")}
          />
        ) : (
          <CoordinatorDashboard alerts={alerts} submissions={submissions} onSendIntervention={handleIntervention}
            notes={notes}
            onHandleNote={handleNoteFollowUp} />
        )}
      </main>
    </div>
  );
}
