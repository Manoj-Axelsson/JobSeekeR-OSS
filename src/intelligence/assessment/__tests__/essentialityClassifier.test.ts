import { describe, it, expect } from "vitest";
import { classifyEssentiality } from "../EssentialityClassifier";

describe("EssentialityClassifier (v3.1.1 Unit Tests)", () => {
  it("should classify skill in job title as MANDATORY essential", () => {
    const job = { title: "Embedded C++ Firmware Engineer" };
    const result = classifyEssentiality("C++", job);

    expect(result.isEssential).toBe(true);
    expect(result.priority).toBe("MANDATORY");
    expect(result.classificationReason).toContain("appears directly in job title");
  });

  it("should classify top mandatory requirement as MANDATORY essential", () => {
    const job = {
      title: "Fullstack Developer",
      requirements: ["React", "TypeScript", "Node.js"],
    };
    const result = classifyEssentiality("React", job);

    expect(result.isEssential).toBe(true);
    expect(result.priority).toBe("MANDATORY");
  });

  it("should classify skills in preferred section as PREFERRED optional", () => {
    const job = {
      title: "Fullstack Developer",
      requirements: ["React", "Node.js"],
      preferredSkills: ["Docker", "Kubernetes"],
    };
    const result = classifyEssentiality("Docker", job);

    expect(result.isEssential).toBe(false);
    expect(result.priority).toBe("PREFERRED");
  });
});
