import { describe, expect, it } from "vitest";
import { actionFor, buildSubmission, computeRisk, riskLevel, scoreEmoji } from "./pulse";

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
