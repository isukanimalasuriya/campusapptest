import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clamp, escapeRegex, sanitizeOfferBody, LIMITS } from "./skillValidation.js";

describe("skillValidation", () => {
  it("clamp truncates long strings", () => {
    const s = "a".repeat(LIMITS.skillName + 10);
    assert.equal(sanitizeOfferBody({ skillName: s }).skillName.length, LIMITS.skillName);
  });

  it("clamp handles null", () => {
    assert.equal(clamp(null, 10), "");
  });

  it("escapeRegex escapes special chars", () => {
    assert.equal(escapeRegex("a.b"), "a\\.b");
    assert.equal(escapeRegex("x[y]"), "x\\[y\\]");
  });

  it("sanitizeOfferBody trims and caps", () => {
    const o = sanitizeOfferBody({
      skillName: "  React  ",
      subject: "CS",
      moduleCode: "IT1234",
      description: "x".repeat(LIMITS.description + 5),
      skillLevel: "Beginner",
      mode: "Online",
      isPublic: true,
      availability: new Date().toISOString(),
    });
    assert.equal(o.skillName, "React");
    assert.equal(o.description.length, LIMITS.description);
  });
});
