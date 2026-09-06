import { describe, it, expect } from "vitest";
import { verifyEvidenceDepth } from "../EvidenceDepthVerifier";

describe("EvidenceDepthVerifier (v3.1.1 Unit Tests)", () => {
  it("should classify attributable work history / project experience as ANCHORED_EVIDENCE -> DEMONSTRATED_PRESENCE", () => {
    const profile = {
      skills: ["React", "TypeScript", "Node.js"],
      experiences: [
        {
          title: "Fullstack Developer",
          company: "Nordic Tech AB",
          description: "Built scalable web apps using React and TypeScript",
          skillsUsed: ["React", "TypeScript"],
        },
      ],
    };

    const reactResult = verifyEvidenceDepth("React", profile);
    expect(reactResult.provenance).toBe("ANCHORED_EVIDENCE");
    expect(reactResult.depthRating).toBe("ANCHORED_EVIDENCE");
    expect(reactResult.status).toBe("DEMONSTRATED_PRESENCE");
    expect(reactResult.demonstratedIn).toContain("Fullstack Developer at Nordic Tech AB");
  });

  it("should classify standalone skill keywords without role anchors as BARE_KEYWORD_ASSERTION -> UNKNOWN_INSUFFICIENT_EVIDENCE", () => {
    const profile = {
      skills: ["Go", "Docker"],
      experiences: [
        {
          title: "Frontend Developer",
          company: "WebCorp AB",
          description: "Created UI components using CSS and HTML",
          skillsUsed: ["CSS", "HTML"],
        },
      ],
    };

    const goResult = verifyEvidenceDepth("Go", profile);
    expect(goResult.provenance).toBe("BARE_KEYWORD_ASSERTION");
    expect(goResult.depthRating).toBe("BARE_KEYWORD_ASSERTION");
    expect(goResult.status).toBe("UNKNOWN_INSUFFICIENT_EVIDENCE");
    expect(goResult.demonstratedIn).toHaveLength(0);
  });

  it("should classify unrecorded skills missing completely from profile as NO_MATCH -> UNKNOWN_INSUFFICIENT_EVIDENCE", () => {
    const profile = {
      skills: ["React", "Node.js"],
      experiences: [
        {
          title: "Fullstack Developer",
          company: "Tech AB",
          description: "Developed APIs with Node.js",
          skillsUsed: ["Node.js"],
        },
      ],
    };

    const pythonResult = verifyEvidenceDepth("Python", profile);
    expect(pythonResult.provenance).toBe("NO_MATCH");
    expect(pythonResult.depthRating).toBe("UNVERIFIED");
    expect(pythonResult.status).toBe("UNKNOWN_INSUFFICIENT_EVIDENCE");
    expect(pythonResult.demonstratedIn).toHaveLength(0);
  });

  it("should classify explicit negative declarations as DEMONSTRATED_ABSENCE", () => {
    const profile = {
      skills: ["React"],
      declaredAbsences: ["C++"],
    };

    const cppResult = verifyEvidenceDepth("C++", profile);
    expect(cppResult.provenance).toBe("NO_MATCH");
    expect(cppResult.status).toBe("DEMONSTRATED_ABSENCE");
    expect(cppResult.demonstratedIn).toHaveLength(0);
  });
});
