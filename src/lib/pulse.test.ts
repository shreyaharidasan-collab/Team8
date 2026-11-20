import { describe, expect, it } from "vitest";
import { SEED_ALERTS, SEED_NOTES, buildDropboxNote, countOpenFollowUps, actionFor, buildSubmission, computeRisk, countAtRisk, deptHealth, riskLevel, scoreEmoji, topBlockers } from "./pulse";

describe("pulse scoring", () => {
  it("scores all-5 check-ins as zero risk and all-1 as 100", () => {
    expect(computeRisk({ mentorship: 5, onboarding: 5, team: 5, career: 5 })).toBe(0);
    expect(computeRisk({ mentorship: 1, onboarding: 1, team: 1, career: 1 })).toBe(100);
  });

  it("classifies 80+ as High, 60–79 as Medium, below 60 as Low", () => {
    expect(riskLevel(80)).toBe("High");
    expect(riskLevel(79)).toBe("Medium");
    expect(riskLevel(60)).toBe("Medium");
    expect(riskLevel(59)).toBe("Low");
  });

  it("maps slider values 1 to 5 onto 😞 through 😄", () => {
    expect(scoreEmoji(1)).toBe("😞");
    expect(scoreEmoji(5)).toBe("😄");
  });

  it("sends anonymous mentorship drops to the opt-in relay", () => {
    expect(actionFor("mentorship", true)).toBe("relay");
    expect(actionFor("onboarding", false)).toBe("escalate");
  });

  it("adds a coordinator alert for risky check-ins and hides the name when anonymous", () => {
    const { alert } = buildSubmission({
      scores: { mentorship: 3, onboarding: 1, team: 2, career: 2 },
      feedback: "Still no VPN access",
      anonymous: true,
      name: "Jordan Patel",
      department: "T&O",
      departmentLabel: "T&O - Software Engineering",
      anonId: 517,
    });
    expect(alert?.name).toBe("Anonymous #517");
    expect(alert?.department).toBe("T&O");
    expect(alert?.action).toBe("escalate");
  });

  it("does not raise an alert for a healthy check-in", () => {
    const { alert } = buildSubmission({
      scores: { mentorship: 5, onboarding: 4, team: 5, career: 4 },
      feedback: "",
      anonymous: false,
      name: "Jordan Patel",
      department: "T&O",
      departmentLabel: "T&O - Software Engineering",
      anonId: 1,
    });
    expect(alert).toBeNull();
  });
});

describe("dynamic dashboard state", () => {
  const checkIn = (department: "T&O" | "Cyber Security", scores: number, feedback: string) =>
    buildSubmission({
      scores: { mentorship: scores, onboarding: scores, team: scores, career: scores },
      feedback,
      anonymous: true,
      name: "Jordan Patel",
      department,
      departmentLabel: department,
      anonId: 500,
    });

  it("keeps the At-Risk count equal to the number of rows", () => {
    expect(countAtRisk(SEED_ALERTS)).toBe(6);
    const { alert } = checkIn("T&O", 1, "no vpn");
    expect(countAtRisk([alert!, ...SEED_ALERTS])).toBe(7);
  });

  it("lowers a department's sentiment after a negative check-in", () => {
    const before = deptHealth([]).find((d) => d.department === "Cyber Security")!.sentiment;
    const { submission } = checkIn("Cyber Security", 1, "");
    const after = deptHealth([submission]).find((d) => d.department === "Cyber Security")!.sentiment;
    expect(after).toBeLessThan(before);
  });

  it("surfaces new blocker themes from feedback", () => {
    const subs = Array.from({ length: 30 }, () => checkIn("T&O", 2, "I feel isolated and alone").submission);
    expect(topBlockers(subs).map((b) => b.tag)).toContain("isolated");
  });
});

describe("open dropbox", () => {
  const base = { message: "  Need help  ", department: "T&O" as const, departmentLabel: "T&O", anonId: 321 };

  it("hides the name when anonymous and falls back to anonymous when no name is given", () => {
    expect(buildDropboxNote({ ...base, followUp: true, anonymous: true, name: "Jordan Patel" }).name).toBe("Anonymous #321");
    const blank = buildDropboxNote({ ...base, followUp: false, anonymous: false, name: "  " });
    expect(blank.anonymous).toBe(true);
    const named = buildDropboxNote({ ...base, followUp: false, anonymous: false, name: "Jordan Patel" });
    expect([named.name, named.anonymous, named.message]).toEqual(["Jordan Patel", false, "Need help"]);
  });

  it("counts only unhandled follow-up requests", () => {
    const n = buildDropboxNote({ ...base, followUp: true, anonymous: true, name: "" });
    expect(countOpenFollowUps([n, ...SEED_NOTES])).toBe(2);
    expect(countOpenFollowUps([{ ...n, handled: true }, ...SEED_NOTES])).toBe(1);
    expect(countOpenFollowUps([buildDropboxNote({ ...base, followUp: false, anonymous: true, name: "" })])).toBe(0);
  });
});
