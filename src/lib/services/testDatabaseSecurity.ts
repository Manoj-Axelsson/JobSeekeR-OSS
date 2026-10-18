/**
 * Test Database Target Security & Fail-Closed Guard
 *
 * Gate C-S1 Stage A Approved Contract: Option 1B (Local/CI-only)
 *
 * Statically approves ONLY:
 * 1. Local Docker Rehearsal Profile: 127.0.0.1:15433/jobseeker_ci
 * 2. GitHub Actions PostgreSQL Service Profile: localhost:5432/jobseeker_ci (when CI=true)
 *
 * ALL remote PostgreSQL targets (including Neon) are strictly EXCLUDED in Stage A.
 */

export const FORBIDDEN_PRODUCTION_HOST = "ep-late-shape-b1p82mih";

export const APPROVED_LOCAL_PROFILE = {
  host: "127.0.0.1",
  port: "15433",
  database: "jobseeker_ci",
} as const;

export const APPROVED_CI_PROFILE = {
  host: "localhost",
  port: "5432",
  database: "jobseeker_ci",
} as const;

export type TargetErrorCode =
  | "ERR_TEST_DB_MISSING"
  | "ERR_TEST_DB_MALFORMED"
  | "ERR_TEST_DB_INVALID_PROTOCOL"
  | "ERR_TEST_DB_PRODUCTION_DENIED"
  | "ERR_TEST_DB_REMOTE_EXCLUDED"
  | "ERR_TEST_DB_UNAPPROVED_TARGET";

export interface TargetValidationResult {
  valid: boolean;
  code?: TargetErrorCode;
  error?: string;
  sanitizedTarget?: {
    protocol: string;
    host: string;
    port: string;
    database: string;
  };
}

/**
 * Sanitizes a database URL for error messages, stripping credentials and tokens.
 */
export function sanitizeDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "[REDACTED]";
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname || "[unknown-host]";
    const port = parsed.port ? `:${parsed.port}` : "";
    const pathname = parsed.pathname || "";
    return `${parsed.protocol}//${host}${port}${pathname}`;
  } catch {
    return "[MALFORMED_URL_REDACTED]";
  }
}

/**
 * Pure target-validation function implementing the Gate C-S1 Option 1B contract.
 *
 * - Does not read process.env.DATABASE_URL or any other variable.
 * - Does not construct database clients or open network sockets.
 * - Returns deterministic error codes and sanitized error messages.
 */
export function validateTestDatabaseUrl(
  rawUrl?: string,
  options?: { isCi?: boolean }
): TargetValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return {
      valid: false,
      code: "ERR_TEST_DB_MISSING",
      error: "TEST_DATABASE_URL environment variable is not defined or empty.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      valid: false,
      code: "ERR_TEST_DB_MALFORMED",
      error: "TEST_DATABASE_URL is a malformed URL.",
    };
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    return {
      valid: false,
      code: "ERR_TEST_DB_INVALID_PROTOCOL",
      error: `Invalid protocol "${parsed.protocol}". PostgreSQL protocol (postgresql: or postgres:) is required.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const port = parsed.port || "5432";
  const database = parsed.pathname.replace(/^\//, "");

  // Secondary Production Safeguard: Check production denylist
  if (hostname.includes(FORBIDDEN_PRODUCTION_HOST)) {
    return {
      valid: false,
      code: "ERR_TEST_DB_PRODUCTION_DENIED",
      error:
        "Security violation: TEST_DATABASE_URL points to the forbidden production database host.",
    };
  }

  // Reject all remote hosts (including Neon) in Stage A
  if (
    hostname.includes("neon.tech") ||
    hostname.includes("aws.neon.tech") ||
    !["127.0.0.1", "localhost"].includes(hostname)
  ) {
    return {
      valid: false,
      code: "ERR_TEST_DB_REMOTE_EXCLUDED",
      error: `Remote targets (including Neon) are strictly excluded under the Gate C-S1 Option 1B contract. Target host: ${hostname}.`,
    };
  }

  // Check Local Docker Rehearsal Profile: 127.0.0.1:15433/jobseeker_ci
  const isLocalRehearsal =
    hostname === "127.0.0.1" && port === "15433" && database === "jobseeker_ci";

  if (isLocalRehearsal) {
    return {
      valid: true,
      sanitizedTarget: {
        protocol: parsed.protocol,
        host: hostname,
        port,
        database,
      },
    };
  }

  // Check CI Service Profile: localhost:5432/jobseeker_ci (only when CI=true or explicitly in CI)
  const isCiEnv = options?.isCi ?? process.env.CI === "true";
  const isCiService =
    hostname === "localhost" && port === "5432" && database === "jobseeker_ci" && isCiEnv;

  if (isCiService) {
    return {
      valid: true,
      sanitizedTarget: {
        protocol: parsed.protocol,
        host: hostname,
        port,
        database,
      },
    };
  }

  // Target does not match approved local/CI profiles
  return {
    valid: false,
    code: "ERR_TEST_DB_UNAPPROVED_TARGET",
    error: `Unapproved target "${hostname}:${port}/${database}". Only 127.0.0.1:15433/jobseeker_ci and CI localhost:5432/jobseeker_ci are approved.`,
  };
}

/**
 * Authoritative required integration suite inventory for Gate C-S1A Stage A.
 */
export const REQUIRED_INTEGRATION_SUITES = [
  "src/lib/services/__tests__/postgresql_integration.test.ts",
  "src/lib/services/__tests__/deduplication.test.ts",
  "src/lib/services/__tests__/job_ad_source.test.ts",
  "src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
] as const;

export interface GateValidationResult {
  valid: boolean;
  code?: string;
  error?: string;
}

/**
 * Evaluates Vitest execution JSON report against authoritative integration gate rules.
 * Enforces:
 * 1. Non-empty report (ERR_GATE_EMPTY_REPORT)
 * 2. Total passed tests > 0 (ERR_GATE_ZERO_TESTS)
 * 3. Deterministic sequential suite verification across requiredSuites:
 *    - Presence: matchingFiles.length === 0 -> ERR_GATE_SUITE_UNDISCOVERED
 *    - Uniqueness: matchingFiles.length > 1 -> ERR_GATE_DUPLICATE_SUITE
 *    - Execution: passed assertions === 0 -> ERR_GATE_SUITE_SKIPPED
 * 4. Zero test failures across report (ERR_GATE_TESTS_FAILED)
 *
 * Path normalization: normalizes Windows backslashes (\) to forward slashes (/)
 * ensuring cross-platform portability without altering anchored suffix comparison.
 */
export function evaluateIntegrationGateReport(
  report: any,
  requiredSuites: readonly string[] = REQUIRED_INTEGRATION_SUITES
): GateValidationResult {
  if (!report || typeof report !== "object") {
    return {
      valid: false,
      code: "ERR_GATE_EMPTY_REPORT",
      error: "Integration test report is missing or null.",
    };
  }

  const numPassed = report.numPassedTests ?? 0;
  const numTotal = report.numTotalTests ?? 0;
  const numFailed = report.numFailedTests ?? 0;

  if (numPassed === 0) {
    return {
      valid: false,
      code: "ERR_GATE_ZERO_TESTS",
      error: `Zero integration tests executed (passed: ${numPassed}, total: ${numTotal}).`,
    };
  }

  const testResults = Array.isArray(report.testResults) ? report.testResults : [];
  const normalizePath = (p: string) => p.replace(/\\/g, "/");

  for (const suite of requiredSuites) {
    const normSuite = normalizePath(suite);
    const matchingFiles = testResults.filter(
      (r: any) => typeof r.name === "string" && normalizePath(r.name).endsWith(normSuite)
    );
    if (matchingFiles.length === 0) {
      return {
        valid: false,
        code: "ERR_GATE_SUITE_UNDISCOVERED",
        error: `Required integration suite was not discovered or executed: ${suite}`,
      };
    }
    if (matchingFiles.length > 1) {
      return {
        valid: false,
        code: "ERR_GATE_DUPLICATE_SUITE",
        error: `Duplicate execution results detected for required integration suite: ${suite}`,
      };
    }

    const fileResult = matchingFiles[0];
    const assertions = Array.isArray(fileResult.assertionResults)
      ? fileResult.assertionResults
      : [];
    const passedInFile = assertions.filter((a: any) => a.status === "passed").length;
    if (passedInFile === 0) {
      return {
        valid: false,
        code: "ERR_GATE_SUITE_SKIPPED",
        error: `Required integration suite had 0 passed tests or was skipped: ${suite}`,
      };
    }
  }

  if (numFailed > 0) {
    return {
      valid: false,
      code: "ERR_GATE_TESTS_FAILED",
      error: `Test failures detected during integration execution: ${numFailed} failed.`,
    };
  }

  return { valid: true };
}
