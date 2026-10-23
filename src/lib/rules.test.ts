import { describe, expect, it } from "vitest";
import { effectivePoints, resolveVotes, validateSubmission, validateVote } from "./rules";

const at = (s: number) => new Date(2025, 0, 1, 12, 0, s);

describe("effectivePoints", () => {
  it("gibt Geständnis-Bonus von 10 % aufgerundet", () => {
    expect(effectivePoints(5, false)).toBe(5);
    expect(effectivePoints(5, true)).toBe(6);
    expect(effectivePoints(10, true)).toBe(11);
    expect(effectivePoints(2, true)).toBe(3);
  });
});

describe("validateSubmission", () => {
  it("verbietet Selbstanzeige und Täter = Opfer", () => {
    expect(validateSubmission({ submitterId: "a", accusedId: "a", victimId: "b" })).toBeTruthy();
    expect(validateSubmission({ submitterId: "a", accusedId: "b", victimId: "b" })).toBeTruthy();
    expect(validateSubmission({ submitterId: "a", accusedId: "b", victimId: "c" })).toBeNull();
  });
  it("erlaubt, selbst das Opfer zu sein", () => {
    expect(validateSubmission({ submitterId: "a", accusedId: "b", victimId: "a" })).toBeNull();
  });
});

describe("validateVote", () => {
  const base = { submitterId: "a", voterId: "b", alreadyVoted: false, status: "pending" };
  it("erlaubt fremde, offene Fälle", () => expect(validateVote(base)).toBeNull());
  it("verbietet eigenen Fall, doppelte Stimme und entschiedene Fälle", () => {
    expect(validateVote({ ...base, voterId: "a" })).toBeTruthy();
    expect(validateVote({ ...base, alreadyVoted: true })).toBeTruthy();
    expect(validateVote({ ...base, status: "committed" })).toBeTruthy();
  });
});

describe("resolveVotes", () => {
  it("bleibt offen ohne Stimmen", () => {
    expect(resolveVotes([], "x").status).toBe("pending");
  });
  it("eine Bestätigung genügt", () => {
    expect(resolveVotes([{ verdict: "approve", voterId: "b", createdAt: at(1) }], "x")).toEqual({
      status: "committed",
      confessed: false,
    });
  });
  it("Bestätigung durch den Beschuldigten ist ein Geständnis", () => {
    expect(resolveVotes([{ verdict: "approve", voterId: "x", createdAt: at(1) }], "x")).toEqual({
      status: "committed",
      confessed: true,
    });
  });
  it("eine Ablehnung allein stellt nichts ein", () => {
    expect(resolveVotes([{ verdict: "reject", voterId: "b", createdAt: at(1) }], "x").status).toBe("pending");
  });
  it("zwei Ablehnungen stellen den Fall ein", () => {
    expect(
      resolveVotes(
        [
          { verdict: "reject", voterId: "b", createdAt: at(1) },
          { verdict: "reject", voterId: "c", createdAt: at(2) },
        ],
        "x",
      ).status,
    ).toBe("rejected");
  });
  it("eine Ablehnung und danach eine Bestätigung -> bestätigt", () => {
    expect(
      resolveVotes(
        [
          { verdict: "approve", voterId: "c", createdAt: at(2) },
          { verdict: "reject", voterId: "b", createdAt: at(1) },
        ],
        "x",
      ).status,
    ).toBe("committed");
  });
});
