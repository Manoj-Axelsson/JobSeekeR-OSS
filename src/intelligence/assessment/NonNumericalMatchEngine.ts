/**
 * Non-Numerical Match Diagnostic Engine (v3.1.1)
 *
 * Assembles non-numerical competency fit diagnostics, transferable capabilities, EQF autonomy scope alignment,
 * and unverified notices while enforcing strict non-transferability boundary guards.
 */

import {
  RequirementState,
  VerifiabilityClass,
  StructuralEvidenceCondition,
  EssentialCompetencyFit,
  OptionalCompetencyFit,
  TransferableCapabilityFit,
  EQFAutonomyAlignment,
  UnverifiedRequirementNotice,
} from "./NonNumericalContract";
import { classifyEssentiality } from "./EssentialityClassifier";
import { verifyEvidenceDepth, CandidateProfilePayload } from "./EvidenceDepthVerifier";

export interface RawJobPayload {
  title: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  preferredSkills?: string[];
  requiredLanguages?: string[];
  requiresCitizenship?: boolean;
  targetCitizenship?: string;
  securityClearanceRequired?: boolean;
  requiredEqfLevel?: string;
}

export interface MatchDiagnosticResult {
  essentialCompetencies: EssentialCompetencyFit[];
  optionalCompetencies: OptionalCompetencyFit[];
  transferableCapabilities: TransferableCapabilityFit[];
  autonomyAlignment: EQFAutonomyAlignment;
  unverifiedNotices: UnverifiedRequirementNotice[];
  aggregateEvidenceCondition: StructuralEvidenceCondition;
}

/**
 * Common transferable capability domain mapping rules (e.g. Systems Engineering -> IoT telemetry).
 */
const DOMAIN_TRANSFER_MAPPINGS: Array<{
  sourceKeyword: string;
  targetRequirement: string;
  transferRationale: string;
}> = [
  {
    sourceKeyword: "systems engineering",
    targetRequirement: "IoT Sensor Data",
    transferRationale: "Systems Engineering background provides helpful domain context for sensor networks, but does NOT replace core backend programming depth.",
  },
  {
    sourceKeyword: "six sigma",
    targetRequirement: "Firmware Quality Assurance",
    transferRationale: "Quality assurance and root cause analysis methodologies transfer across engineering domains, but cannot replace core C++ execution.",
  },
  {
    sourceKeyword: "dmaic",
    targetRequirement: "Quality Improvement",
    transferRationale: "Structured DMAIC root cause analysis methodologies transfer directly across engineering domains.",
  },
];

/**
 * Computes non-numerical match diagnostic result for a candidate against a job posting.
 */
export function computeMatchDiagnostics(
  job: RawJobPayload,
  profile: CandidateProfilePayload & {
    headline?: string;
    eqfLevel?: string;
  }
): MatchDiagnosticResult {
  const essentialCompetencies: EssentialCompetencyFit[] = [];
  const optionalCompetencies: OptionalCompetencyFit[] = [];
  const transferableCapabilities: TransferableCapabilityFit[] = [];
  const unverifiedNotices: UnverifiedRequirementNotice[] = [];

  // 1. Extract requirements list from job payload
  const rawRequirements = job.requirements || [];
  const preferredSkills = job.preferredSkills || [];

  // Combine requirements for classification
  for (const reqName of rawRequirements) {
    const classification = classifyEssentiality(reqName, job);
    const verification = verifyEvidenceDepth(reqName, profile);

    if (classification.isEssential) {
      essentialCompetencies.push({
        competency: reqName,
        status: verification.status,
        depthRating: verification.depthRating,
        provenance: verification.provenance,
        demonstratedIn: verification.demonstratedIn.length > 0 ? verification.demonstratedIn : undefined,
      });

      // Generate action notice if essential requirement is unverified (UNKNOWN or BARE_KEYWORD_ASSERTION)
      if (verification.status === "UNKNOWN_INSUFFICIENT_EVIDENCE") {
        const promptText =
          verification.provenance === "BARE_KEYWORD_ASSERTION"
            ? `${reqName} is listed in your profile as an unanchored keyword assertion without deliverable project context. Verify your production experience before applying.`
            : `${reqName} is required by ${job.company || "the company"}, but is completely UNRECORDED in your profile (UNKNOWN_INSUFFICIENT_EVIDENCE). JobSeekeR has zero evidence for ${reqName} in your recorded experience. Verify your depth before applying.`;

        unverifiedNotices.push({
          requirementName: reqName,
          category: "TECHNICAL_SPECIALTY",
          userActionPrompt: promptText,
        });
      }
    } else {
      const isMatched = verification.status === "DEMONSTRATED_PRESENCE";
      optionalCompetencies.push({
        competency: reqName,
        priority: classification.priority === "NICE_TO_HAVE" ? "NICE_TO_HAVE" : "PREFERRED",
        isMatched,
        demonstratedIn: verification.demonstratedIn.length > 0 ? verification.demonstratedIn : undefined,
      });
    }
  }

  // Handle explicit preferred skills if passed separately
  for (const prefName of preferredSkills) {
    if (!optionalCompetencies.some((o) => o.competency.toLowerCase() === prefName.toLowerCase())) {
      const verification = verifyEvidenceDepth(prefName, profile);
      optionalCompetencies.push({
        competency: prefName,
        priority: "PREFERRED",
        isMatched: verification.status === "DEMONSTRATED_PRESENCE",
        demonstratedIn: verification.demonstratedIn.length > 0 ? verification.demonstratedIn : undefined,
      });
    }
  }

  // 2. Identify Transferable Capabilities (Strict Non-Transferability Guard)
  // Transferable narrative is generated for candidate context, but strictly NEVER alters essential core requirement states
  if (profile.skills) {
    const flatSkills = Array.isArray(profile.skills) ? profile.skills : Object.values(profile.skills).flat();
    for (const rule of DOMAIN_TRANSFER_MAPPINGS) {
      if (flatSkills.some((s) => s.toLowerCase().includes(rule.sourceKeyword))) {
        transferableCapabilities.push({
          targetRequirement: rule.targetRequirement,
          sourceCapability: rule.sourceKeyword,
          transferRationale: rule.transferRationale,
          escoRelationship: "CROSS_DOMAIN_TRANSFER",
        });
      }
    }
  }

  // 3. Evaluate EQF Autonomy & Responsibility Alignment
  const requiredEqf = job.requiredEqfLevel || "EQF_LEVEL_7";
  const candidateEqf = profile.eqfLevel || "EQF_LEVEL_7";

  let alignmentStatus: "MATCHED" | "AUTONOMY_STEP_UP" | "EXCEEDS_REQUIREMENT" | "UNSPECIFIED" = "MATCHED";
  let autonomyDescriptor = `Position matches candidate recorded autonomy level (${candidateEqf}).`;

  if (requiredEqf > candidateEqf) {
    alignmentStatus = "AUTONOMY_STEP_UP";
    autonomyDescriptor = `Position represents an increase in autonomy scope (${requiredEqf} vs recorded ${candidateEqf}).`;
  }

  const autonomyAlignment: EQFAutonomyAlignment = {
    requiredLevel: requiredEqf,
    candidateLevel: candidateEqf,
    alignmentStatus,
    autonomyDescriptor,
  };

  // 4. Derive Aggregate Evidence Condition (StructuralEvidenceCondition)
  let aggregateEvidenceCondition: StructuralEvidenceCondition = "ALL_ESSENTIAL_ANCHORED";

  const hasUnverified = essentialCompetencies.some(
    (c) => c.status === "UNKNOWN_INSUFFICIENT_EVIDENCE" || c.provenance === "BARE_KEYWORD_ASSERTION"
  );

  if (hasUnverified) {
    aggregateEvidenceCondition = "UNVERIFIED_ESSENTIALS_PRESENT";
  } else if (essentialCompetencies.some((c) => c.provenance === "NO_MATCH")) {
    aggregateEvidenceCondition = "EVIDENCE_PROVENANCE_INSUFFICIENT";
  }

  return {
    essentialCompetencies,
    optionalCompetencies,
    transferableCapabilities,
    autonomyAlignment,
    unverifiedNotices,
    aggregateEvidenceCondition,
  };
}
