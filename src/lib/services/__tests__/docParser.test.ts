import { describe, it, expect } from "vitest";
import { parseAndSaveDocument } from "../docParser";

describe("Document Parser Service", () => {
  it("should extract skills and text from raw document buffer", async () => {
    const textSample = "Resume for Jane Doe. Experienced with React, TypeScript, Python, and Six Sigma.";
    const buffer = Buffer.from(textSample, "utf-8");

    const result = await parseAndSaveDocument("jane_doe_cv.txt", buffer, "CV");

    expect(result.filename).toBe("jane_doe_cv.txt");
    expect(result.extractedText).toContain("Jane Doe");
    expect(result.extractedSkills).toContain("React");
    expect(result.extractedSkills).toContain("TypeScript");
    expect(result.extractedSkills).toContain("Python");
    expect(result.extractedSkills).toContain("Six Sigma");
  });
});
