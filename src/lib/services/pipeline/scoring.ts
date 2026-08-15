export interface DualScoreResult {
  capabilityScore: number; // 0 to 100
  intentScore: number;     // 0 to 100
  totalMatchScore: number; // 0 to 100
  matchedSkills: string[];
  missingSkills: string[];
  matchedNiceToHave: string[];
  transferableStrengths: string[];
}

export function evaluateCapabilityAndIntent(
  title: string,
  description: string,
  candidateSkills: string[],
  candidateHeadline: string,
  preferList: string[],
  niceToHaveList: string[],
  targetOccupations: string[]
): DualScoreResult {
  const text = `${title} ${description}`.toLowerCase();
  
  // 1. Calculate Capability Fit Score (What can this candidate actually do?)
  const matchedSet = new Set<string>();
  const missingSet = new Set<string>();

  let capabilityHits = 0;
  if (candidateSkills && candidateSkills.length > 0) {
    for (const skill of candidateSkills) {
      const sLower = skill.toLowerCase().trim();
      if (sLower && text.includes(sLower)) {
        capabilityHits++;
        matchedSet.add(capitalize(skill));
      }
    }
  }

  const capabilityRatio = candidateSkills.length > 0
    ? capabilityHits / Math.min(candidateSkills.length, 10)
    : 0.5;

  const capabilityScore = Math.min(100, Math.round(capabilityRatio * 100));

  // 2. Calculate Intent Fit Score (What do they want?)
  let intentHits = 0;
  let totalIntentWeight = 0;

  // Target Occupations match
  if (targetOccupations && targetOccupations.length > 0) {
    totalIntentWeight += 2;
    for (const occ of targetOccupations) {
      if (occ && text.includes(occ.toLowerCase())) {
        intentHits += 2;
        break;
      }
    }
  }

  // Prefer criteria match (Major ranking influence)
  if (preferList && preferList.length > 0) {
    totalIntentWeight += preferList.length;
    for (const pref of preferList) {
      if (pref && text.includes(pref.toLowerCase())) {
        intentHits += 1;
        matchedSet.add(capitalize(pref));
      } else if (pref) {
        missingSet.add(capitalize(pref));
      }
    }
  }

  const intentRatio = totalIntentWeight > 0 ? intentHits / totalIntentWeight : 0.7;
  const intentScore = Math.min(100, Math.round(intentRatio * 100));

  // 3. Evaluate Nice To Have (Positive additive boost, non-punitive if missing)
  const matchedNiceToHave: string[] = [];
  if (niceToHaveList && niceToHaveList.length > 0) {
    for (const nth of niceToHaveList) {
      if (nth && text.includes(nth.toLowerCase())) {
        matchedNiceToHave.push(capitalize(nth));
        matchedSet.add(capitalize(nth));
      }
    }
  }

  // Nice To Have adds positive bonus (+5 per match, max +15), absence does NOT penalize
  const niceToHaveBonus = Math.min(15, matchedNiceToHave.length * 5);

  // 4. Compute Weighted Total Score (60% Capability + 40% Intent + NiceToHave bonus)
  const baseTotal = Math.round(capabilityScore * 0.55 + intentScore * 0.45);
  const totalMatchScore = Math.min(100, Math.max(0, baseTotal + niceToHaveBonus));

  // Transferable Strengths for Pitching
  const transferableStrengths = Array.from(matchedSet).slice(0, 4);
  if (transferableStrengths.length === 0) {
    transferableStrengths.push(candidateHeadline || "Engineering Fundamentals", "Systematic Problem Solving");
  }

  return {
    capabilityScore,
    intentScore,
    totalMatchScore,
    matchedSkills: Array.from(matchedSet).slice(0, 10),
    missingSkills: Array.from(missingSet).slice(0, 6),
    matchedNiceToHave,
    transferableStrengths,
  };
}

function capitalize(str: string): string {
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
