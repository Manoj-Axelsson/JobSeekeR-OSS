export interface EligibilityResult {
  status: "ELIGIBLE" | "INELIGIBLE" | "DISCARDED";
  feedType: "PRIMARY" | "DISCOVERY";
  reasons: string[];
  matchedMustHave: string[];
  missingMustHave: string[];
  matchedExclude: string[];
  matchedExplore: string[];
  inTerritory: boolean;
}

export interface TerritoryConfig {
  countries: string[];
  regions: string[];
  municipalities: string[];
  cities: string[];
  remotePolicy: "REQUIRED" | "ALLOWED" | "NO_REMOTE";
  discoveryPolicy: "SHOW_SEPARATELY" | "STRICT_LOCAL_ONLY";
}

export interface PreferencesConfig {
  mustHave: string[];
  prefer: string[];
  niceToHave: string[];
  exclude: string[];
  explore: string[];
  targetOccupations: string[];
}

/**
 * Evaluates Job Opportunity against SearchProfile preferences & SearchTerritory.
 * Enforces Constitutional Principle I: Primary vs Discovery Feed Separation.
 */
export function evaluateEligibility(
  title: string,
  location: string,
  description: string,
  company: string,
  preferences: PreferencesConfig,
  territory: TerritoryConfig
): EligibilityResult {
  const text = `${title} ${description} ${company}`.toLowerCase();
  const locLower = location.toLowerCase();
  const reasons: string[] = [];

  // 1. Check Exclude Rules (Immediate Elimination)
  const matchedExclude: string[] = [];
  if (preferences.exclude && preferences.exclude.length > 0) {
    for (const ex of preferences.exclude) {
      if (ex && text.includes(ex.toLowerCase())) {
        matchedExclude.push(ex);
      }
    }
  }

  if (matchedExclude.length > 0) {
    return {
      status: "DISCARDED",
      feedType: "DISCOVERY",
      reasons: [`Eliminated by Exclude rule: ${matchedExclude.join(", ")}`],
      matchedMustHave: [],
      missingMustHave: [],
      matchedExclude,
      matchedExplore: [],
      inTerritory: false,
    };
  }

  // 2. Check Must Have Rules (Hard Eligibility Gate)
  const matchedMustHave: string[] = [];
  const missingMustHave: string[] = [];
  if (preferences.mustHave && preferences.mustHave.length > 0) {
    for (const req of preferences.mustHave) {
      if (req) {
        if (text.includes(req.toLowerCase())) {
          matchedMustHave.push(req);
        } else {
          missingMustHave.push(req);
        }
      }
    }
  }

  if (missingMustHave.length > 0) {
    return {
      status: "INELIGIBLE",
      feedType: "DISCOVERY",
      reasons: [`Failed Must Have requirements: ${missingMustHave.join(", ")}`],
      matchedMustHave,
      missingMustHave,
      matchedExclude: [],
      matchedExplore: [],
      inTerritory: false,
    };
  }

  // 3. Evaluate SearchTerritory Boundaries
  let inTerritory = false;
  const isRemoteJob = locLower.includes("remote") || text.includes("distans") || text.includes("work from home");

  if (isRemoteJob && territory.remotePolicy !== "NO_REMOTE") {
    inTerritory = true;
    reasons.push("Matches Remote work policy.");
  } else {
    // Check municipality / region / city matches
    const allLocations = [
      ...(territory.municipalities || []),
      ...(territory.regions || []),
      ...(territory.cities || []),
      ...(territory.countries || []),
    ].map(l => l.toLowerCase());

    if (allLocations.length === 0 || locLower.includes("sweden") || locLower.includes("sverige")) {
      inTerritory = true;
    } else {
      inTerritory = allLocations.some(l => locLower.includes(l) || text.includes(l));
    }
  }

  // 4. Evaluate Explore Criteria
  const matchedExplore: string[] = [];
  if (preferences.explore && preferences.explore.length > 0) {
    for (const exp of preferences.explore) {
      if (exp && text.includes(exp.toLowerCase())) {
        matchedExplore.push(exp);
      }
    }
  }

  // 5. Determine Primary vs Discovery Feed Routing
  // Primary Feed requires: In Territory + (no missing Must Have) + (no Exclude match)
  let feedType: "PRIMARY" | "DISCOVERY" = "PRIMARY";

  if (!inTerritory) {
    feedType = "DISCOVERY";
    reasons.push("Located outside primary territory. Routed to Discovery Feed.");
  } else if (matchedExplore.length > 0 && territory.discoveryPolicy === "SHOW_SEPARATELY") {
    // If job was triggered primarily by an Explore interest, route to Discovery
    feedType = "DISCOVERY";
    reasons.push(`Matches Explore discovery interest: ${matchedExplore.join(", ")}`);
  } else {
    feedType = "PRIMARY";
    reasons.push("Direct match for primary search intent and territory.");
  }

  return {
    status: "ELIGIBLE",
    feedType,
    reasons,
    matchedMustHave,
    missingMustHave: [],
    matchedExclude: [],
    matchedExplore,
    inTerritory,
  };
}
