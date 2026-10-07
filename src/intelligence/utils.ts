/**
 * Intelligence Parsing Utilities
 * Provides resilient parsers for serialized domain attributes on JobAd entities.
 */

/**
 * Safely parses serialized JSON skill arrays from JobAd properties (e.g. matchedSkills, missingSkills).
 *
 * Resilient against:
 * - Serialized JSON arrays: '["TypeScript", "React"]'
 * - Already parsed arrays: ["TypeScript", "React"]
 * - Empty string, whitespace, null, undefined
 * - Malformed JSON strings: '{"unclosed'
 * - Non-array JSON values: '{"key": "val"}', '123'
 * - Elements containing surrounding whitespace: '  React  ' -> 'React'
 *
 * Only returns trimmed, non-empty string values.
 */
export function safeParseSkillArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[]") return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim());
      }
    } catch {
      return [];
    }
  }

  return [];
}
