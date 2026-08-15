import { describe, it, expect } from "vitest";
import { evaluateJobMatch } from "../matcher";

describe("JobseekeR™ Skill Matcher Service", () => {
  it("should evaluate a software developer job posting correctly", () => {
    const title = "Senior Fullstack Developer (React, TypeScript, Next.js)";
    const description = "We are seeking an experienced developer with skills in React, TypeScript, Next.js, Node.js, and GraphQL.";
    
    const result = evaluateJobMatch(title, description);

    expect(result.matchScore).toBeGreaterThanOrEqual(40);
    expect(result.matchedSkills.length).toBeGreaterThan(0);
  });

  it("should incorporate custom profile skills from uploaded CV documents", () => {
    const title = "Cloud Solutions Engineer";
    const description = "Role requires Kubernetes, Terraform, AWS, and Python expertise.";
    const customSkills = ["Kubernetes", "Terraform", "AWS", "Python"];

    const result = evaluateJobMatch(title, description, customSkills);

    expect(result.matchScore).toBeGreaterThan(50);
    expect(result.matchedSkills).toContain("Kubernetes");
    expect(result.matchedSkills).toContain("Terraform");
  });
});
