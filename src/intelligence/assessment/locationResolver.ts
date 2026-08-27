/**
 * Hierarchical Geographic Reasoning Engine & Location Normalisation Gate
 * JobSeekR Intelligence Framework v3.0
 *
 * Location Normalisation Gate:
 * Extracts location evidence from title + description + structured metadata.
 * Detects conflicts (e.g., Title specifies "Luleå" while JobTech metadata specifies "Stockholm").
 * Resolves the canonical role location for eligibility and intent evaluation while preserving
 * the raw `sourceLocation` metadata untouched for data auditing.
 */

export type GeoLevel = "CITY" | "REGION" | "COUNTRY" | "NONE";

export interface GeoMatchResult {
  level: GeoLevel;
  matchedPreference?: string;
  isExactCityMatch: boolean;
  isRegionMatch: boolean;
  isCountryMatchOnly: boolean;
  alignmentScore: number; // 0 to 100
}

export interface DetectedLocationItem {
  location: string;
  source: "TITLE" | "DESCRIPTION" | "METADATA";
}

export interface CanonicalLocationResolution {
  sourceLocation: string; // Preserves raw metadata from JobTech untouched!
  canonicalLocation: string; // Resolved canonical location for evaluation
  detectedLocations: DetectedLocationItem[];
  hasConflict: boolean;
  conflictDetails?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  resolutionSource: "TITLE" | "DESCRIPTION" | "METADATA" | "DEFAULT";
}

// Known Swedish municipal/city to region mappings
const CITY_TO_REGION_MAP: Record<string, string> = {
  stockholm: "Stockholm County",
  solna: "Stockholm County",
  sundbyberg: "Stockholm County",
  nacka: "Stockholm County",
  täby: "Stockholm County",
  södertälje: "Stockholm County",
  linköping: "Östergötland",
  norrköping: "Östergötland",
  motala: "Östergötland",
  göteborg: "Västra Götaland",
  gothenburg: "Västra Götaland",
  borås: "Västra Götaland",
  trollhättan: "Västra Götaland",
  malmö: "Skåne",
  lund: "Skåne",
  helsingborg: "Skåne",
  kiruna: "Norrbotten",
  luleå: "Norrbotten",
  skellefteå: "Västerbotten",
  umeå: "Västerbotten",
  uppsala: "Uppsala County",
  västerås: "Västmanland",
  örebro: "Örebro County",
  jönköping: "Jönköping County",
  nyköping: "Södermanland",
  växjö: "Kronoberg",
  hillerstorp: "Jönköping County",
  vårgårda: "Västra Götaland",
};

const COUNTRY_STRINGS = new Set(["sweden", "sverige", "se", "swedish"]);

function capitalizeCity(city: string): string {
  if (city === "göteborg" || city === "gothenburg") return "Göteborg";
  if (city === "malmö") return "Malmö";
  if (city === "luleå") return "Luleå";
  if (city === "umeå") return "Umeå";
  if (city === "linköping") return "Linköping";
  if (city === "norrköping") return "Norrköping";
  if (city === "borås") return "Borås";
  if (city === "västerås") return "Västerås";
  if (city === "örebro") return "Örebro";
  if (city === "jönköping") return "Jönköping";
  if (city === "nyköping") return "Nyköping";
  if (city === "växjö") return "Växjö";
  if (city === "skellefteå") return "Skellefteå";
  return city.charAt(0).toUpperCase() + city.slice(1);
}

function extractCitiesFromText(text: string): string[] {
  const textLower = text.toLowerCase();
  const found: string[] = [];
  for (const city of Object.keys(CITY_TO_REGION_MAP)) {
    // Regex checking word boundary or punctuation surrounding city name
    const pattern = new RegExp(`(?:^|[^a-zäöåA-ZÄÖÅ])${city}(?:$|[^a-zäöåA-ZÄÖÅ])`, "i");
    if (pattern.test(textLower)) {
      found.push(capitalizeCity(city));
    }
  }
  return found;
}

/**
 * Resolves the Canonical Role Location from title, description, and raw metadata.
 * Detects location conflicts while preserving original `sourceLocation` metadata untouched.
 */
export function resolveCanonicalLocation(
  title: string,
  description: string,
  rawMetadataLocation: string = "Sweden"
): CanonicalLocationResolution {
  const sourceLocation = rawMetadataLocation || "Sweden";
  const detectedLocations: DetectedLocationItem[] = [];

  const titleCities = extractCitiesFromText(title);
  for (const c of titleCities) {
    detectedLocations.push({ location: c, source: "TITLE" });
  }

  const metadataCities = extractCitiesFromText(sourceLocation);
  for (const c of metadataCities) {
    detectedLocations.push({ location: c, source: "METADATA" });
  }

  const descCities = extractCitiesFromText(description);
  for (const c of descCities) {
    if (!titleCities.includes(c) && !metadataCities.includes(c)) {
      detectedLocations.push({ location: c, source: "DESCRIPTION" });
    }
  }

  const primaryTitleCity = titleCities[0];
  const primaryMetadataCity = metadataCities[0];
  const primaryDescCity = descCities[0];

  let canonicalLocation = sourceLocation;
  let hasConflict = false;
  let conflictDetails: string | undefined = undefined;
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  let resolutionSource: CanonicalLocationResolution["resolutionSource"] = "METADATA";

  if (primaryTitleCity && primaryMetadataCity && primaryTitleCity.toLowerCase() !== primaryMetadataCity.toLowerCase()) {
    hasConflict = true;
    conflictDetails = `Location conflict detected: Job title explicitly specifies '${primaryTitleCity}' while source metadata specifies '${primaryMetadataCity}'. Title given priority for canonical resolution.`;
    canonicalLocation = primaryTitleCity;
    confidence = "HIGH";
    resolutionSource = "TITLE";
  } else if (primaryTitleCity) {
    canonicalLocation = primaryTitleCity;
    resolutionSource = "TITLE";
    confidence = "HIGH";
  } else if (primaryMetadataCity) {
    canonicalLocation = primaryMetadataCity;
    resolutionSource = "METADATA";
    confidence = "HIGH";
  } else if (primaryDescCity) {
    canonicalLocation = primaryDescCity;
    resolutionSource = "DESCRIPTION";
    confidence = "MEDIUM";
  } else {
    canonicalLocation = sourceLocation;
    resolutionSource = "DEFAULT";
    confidence = "LOW";
  }

  return {
    sourceLocation,
    canonicalLocation,
    detectedLocations,
    hasConflict,
    conflictDetails,
    confidence,
    resolutionSource,
  };
}

/**
 * Resolves geographic alignment between a job location and candidate location preferences.
 */
export function resolveLocationAlignment(
  jobLocationRaw: string,
  candidatePreferences: string[] = [],
  isRemoteJob: boolean = false
): GeoMatchResult {
  if (isRemoteJob) {
    return {
      level: "CITY",
      matchedPreference: "REMOTE",
      isExactCityMatch: true,
      isRegionMatch: true,
      isCountryMatchOnly: false,
      alignmentScore: 100,
    };
  }

  const jobLocLower = jobLocationRaw.toLowerCase().trim();
  const jobCity = extractCity(jobLocLower);
  const jobRegion = jobCity ? CITY_TO_REGION_MAP[jobCity] : undefined;

  let bestLevel: GeoLevel = "NONE";
  let matchedPreference: string | undefined = undefined;
  let alignmentScore = 0;

  for (const prefRaw of candidatePreferences) {
    const prefLower = prefRaw.toLowerCase().trim();

    // 1. Exact City / Municipality Match
    if (jobCity && prefLower === jobCity) {
      return {
        level: "CITY",
        matchedPreference: prefRaw,
        isExactCityMatch: true,
        isRegionMatch: true,
        isCountryMatchOnly: false,
        alignmentScore: 100,
      };
    }

    if (jobLocLower.includes(prefLower) && !COUNTRY_STRINGS.has(prefLower)) {
      bestLevel = "CITY";
      matchedPreference = prefRaw;
      alignmentScore = 90;
      break;
    }

    // 2. Region Match
    if (jobRegion && prefLower === jobRegion.toLowerCase()) {
      bestLevel = "REGION";
      matchedPreference = prefRaw;
      alignmentScore = 65;
    }

    // 3. Country Match
    if (COUNTRY_STRINGS.has(prefLower)) {
      if (bestLevel === "NONE") {
        bestLevel = "COUNTRY";
        matchedPreference = prefRaw;
        alignmentScore = 30;
      }
    }
  }

  return {
    level: bestLevel,
    matchedPreference,
    isExactCityMatch: bestLevel === "CITY",
    isRegionMatch: bestLevel === "CITY" || bestLevel === "REGION",
    isCountryMatchOnly: bestLevel === "COUNTRY",
    alignmentScore,
  };
}

function extractCity(locationText: string): string | undefined {
  for (const city of Object.keys(CITY_TO_REGION_MAP)) {
    if (locationText.includes(city)) {
      return city;
    }
  }
  return undefined;
}
