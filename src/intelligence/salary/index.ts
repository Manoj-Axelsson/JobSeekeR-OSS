export interface SalaryInfo {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryRawText: string | null;
}

export function parseSalaryFromDescription(description: string): SalaryInfo {
  if (!description) {
    return { salaryMin: null, salaryMax: null, salaryCurrency: "SEK", salaryRawText: null };
  }

  const rangePattern = /(?:lön|salary|ersättning|månadslön)?\s*:?\s*(\d{2,3}[\s.]?\d{3})\s*(?:-|till|–)\s*(\d{2,3}[\s.]?\d{3})\s*(?:kr|sek|SEK|\/mån)/i;
  const singlePattern = /(?:lön|salary|ersättning|månadslön)\s*:?\s*(\d{2,3}[\s.]?\d{3})\s*(?:kr|sek|SEK|\/mån)/i;

  const rangeMatch = description.match(rangePattern);
  if (rangeMatch) {
    const minVal = parseInt(rangeMatch[1].replace(/[\s.]/g, ""), 10);
    const maxVal = parseInt(rangeMatch[2].replace(/[\s.]/g, ""), 10);
    if (minVal > 15000 && maxVal > 15000) {
      return {
        salaryMin: minVal,
        salaryMax: maxVal,
        salaryCurrency: "SEK",
        salaryRawText: `${minVal.toLocaleString("sv-SE")} - ${maxVal.toLocaleString("sv-SE")} SEK/mån`,
      };
    }
  }

  const singleMatch = description.match(singlePattern);
  if (singleMatch) {
    const val = parseInt(singleMatch[1].replace(/[\s.]/g, ""), 10);
    if (val > 15000) {
      return {
        salaryMin: val,
        salaryMax: val,
        salaryCurrency: "SEK",
        salaryRawText: `${val.toLocaleString("sv-SE")} SEK/mån`,
      };
    }
  }

  return { salaryMin: null, salaryMax: null, salaryCurrency: "SEK", salaryRawText: null };
}
