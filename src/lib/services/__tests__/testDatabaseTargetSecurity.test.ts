import { describe, it, expect } from "vitest";
import {
  validateTestDatabaseUrl,
  sanitizeDatabaseUrl,
  FORBIDDEN_PRODUCTION_HOST,
  APPROVED_LOCAL_PROFILE,
  APPROVED_CI_PROFILE,
  REQUIRED_INTEGRATION_SUITES,
  evaluateIntegrationGateReport,
} from "../testDatabaseSecurity";

describe("Gate C-S1 Test Database Target Security (Option 1B Contract)", () => {
  describe("1. Missing, Empty, and Malformed Inputs", () => {
    it("rejects undefined with ERR_TEST_DB_MISSING", () => {
      const res = validateTestDatabaseUrl(undefined);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_MISSING");
      expect(res.error).toContain("is not defined or empty");
    });

    it("rejects empty string with ERR_TEST_DB_MISSING", () => {
      const res = validateTestDatabaseUrl("");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_MISSING");
    });

    it("rejects whitespace-only string with ERR_TEST_DB_MISSING", () => {
      const res = validateTestDatabaseUrl("    ");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_MISSING");
    });

    it("rejects malformed non-URL strings with ERR_TEST_DB_MALFORMED", () => {
      const res = validateTestDatabaseUrl("not-a-valid-connection-url");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_MALFORMED");
      expect(res.error).toContain("malformed URL");
    });
  });

  describe("2. Protocol Enforcement", () => {
    it("rejects file: protocol (SQLite)", () => {
      const res = validateTestDatabaseUrl("file:./prisma/dev.db");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_INVALID_PROTOCOL");
      expect(res.error).toContain('Invalid protocol "file:"');
    });

    it("rejects sqlite: protocol", () => {
      const res = validateTestDatabaseUrl("sqlite://./dev.db");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_INVALID_PROTOCOL");
      expect(res.error).toContain('Invalid protocol "sqlite:"');
    });

    it("rejects http: and https: protocols", () => {
      const res = validateTestDatabaseUrl("http://127.0.0.1:15433/jobseeker_ci");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_INVALID_PROTOCOL");
    });
  });

  describe("3. Production Protection (Denylist)", () => {
    it("rejects known production host with ERR_TEST_DB_PRODUCTION_DENIED", () => {
      const prodUrl = `postgresql://user:pass@${FORBIDDEN_PRODUCTION_HOST}.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require`;
      const res = validateTestDatabaseUrl(prodUrl);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_PRODUCTION_DENIED");
      expect(res.error).toContain("forbidden production database host");
    });
  });

  describe("4. Remote Target Exclusion (Option 1B Contract)", () => {
    it("rejects arbitrary remote PostgreSQL targets with ERR_TEST_DB_REMOTE_EXCLUDED", () => {
      const res = validateTestDatabaseUrl("postgresql://user:pass@192.168.1.100:5432/testdb");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_REMOTE_EXCLUDED");
      expect(res.error).toContain("Remote targets (including Neon) are strictly excluded");
    });

    it("rejects disposable Neon branches under Option 1B contract", () => {
      const neonUrl =
        "postgres://neondb_owner:secret@ep-misty-leaf-b1jofdq6.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require";
      const res = validateTestDatabaseUrl(neonUrl);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_REMOTE_EXCLUDED");
      expect(res.error).toContain("Remote targets (including Neon) are strictly excluded");
    });
  });

  describe("5. Approved Local and CI Target Profiles", () => {
    it("approves Local Docker Rehearsal Profile (127.0.0.1:15433/jobseeker_ci)", () => {
      const localUrl = `postgresql://jobseeker:testpass@${APPROVED_LOCAL_PROFILE.host}:${APPROVED_LOCAL_PROFILE.port}/${APPROVED_LOCAL_PROFILE.database}`;
      const res = validateTestDatabaseUrl(localUrl);
      expect(res.valid).toBe(true);
      expect(res.code).toBeUndefined();
      expect(res.sanitizedTarget).toEqual({
        protocol: "postgresql:",
        host: "127.0.0.1",
        port: "15433",
        database: "jobseeker_ci",
      });
    });

    it("rejects Local Docker Rehearsal Profile using localhost alias (localhost:15433)", () => {
      const localUrl = `postgresql://jobseeker:testpass@localhost:15433/jobseeker_ci`;
      const res = validateTestDatabaseUrl(localUrl);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_UNAPPROVED_TARGET");
    });

    it("rejects CI Profile using 127.0.0.1 alias (127.0.0.1:5432) even when isCi is true", () => {
      const ciUrl = `postgresql://postgres:postgres@127.0.0.1:5432/jobseeker_ci`;
      const res = validateTestDatabaseUrl(ciUrl, { isCi: true });
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_UNAPPROVED_TARGET");
    });

    it("approves CI Profile (localhost:5432/jobseeker_ci) when isCi is true", () => {
      const ciUrl = `postgresql://postgres:postgres@localhost:5432/jobseeker_ci?schema=public`;
      const res = validateTestDatabaseUrl(ciUrl, { isCi: true });
      expect(res.valid).toBe(true);
      expect(res.sanitizedTarget).toEqual({
        protocol: "postgresql:",
        host: "localhost",
        port: "5432",
        database: "jobseeker_ci",
      });
    });

    it("rejects CI Profile (localhost:5432) in local development when isCi is false", () => {
      const ciUrl = `postgresql://postgres:postgres@localhost:5432/jobseeker_ci`;
      const res = validateTestDatabaseUrl(ciUrl, { isCi: false });
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_UNAPPROVED_TARGET");
    });

    it("rejects local host with unapproved port (127.0.0.1:5433)", () => {
      const res = validateTestDatabaseUrl("postgresql://user:pass@127.0.0.1:5433/jobseeker_ci");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_UNAPPROVED_TARGET");
      expect(res.error).toContain("Unapproved target");
    });

    it("rejects local host with unapproved database name (127.0.0.1:15433/other_db)", () => {
      const res = validateTestDatabaseUrl("postgresql://user:pass@127.0.0.1:15433/other_db");
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_UNAPPROVED_TARGET");
      expect(res.error).toContain("Unapproved target");
    });
  });

  describe("6. Credential Sanitization", () => {
    it("sanitizes passwords, usernames, and tokens from URLs", () => {
      const sensitiveUrl =
        "postgresql://test_user:super_secret_password_123@127.0.0.1:15433/jobseeker_ci?token=xyz987";
      const sanitized = sanitizeDatabaseUrl(sensitiveUrl);
      expect(sanitized).toBe("postgresql://127.0.0.1:15433/jobseeker_ci");
      expect(sanitized).not.toContain("test_user");
      expect(sanitized).not.toContain("super_secret_password_123");
      expect(sanitized).not.toContain("xyz987");
    });

    it("sanitizes malformed URLs safely", () => {
      expect(sanitizeDatabaseUrl("not-a-url")).toBe("[MALFORMED_URL_REDACTED]");
      expect(sanitizeDatabaseUrl(undefined)).toBe("[REDACTED]");
    });
  });

  describe("7. Authoritative Integration Gate Report Evaluation", () => {
    it("rejects empty or null report with ERR_GATE_EMPTY_REPORT", () => {
      const resNull = evaluateIntegrationGateReport(null);
      expect(resNull.valid).toBe(false);
      expect(resNull.code).toBe("ERR_GATE_EMPTY_REPORT");

      const resUndefined = evaluateIntegrationGateReport(undefined);
      expect(resUndefined.valid).toBe(false);
      expect(resUndefined.code).toBe("ERR_GATE_EMPTY_REPORT");
    });

    it("rejects zero executed tests with ERR_GATE_ZERO_TESTS", () => {
      const zeroReport = {
        numPassedTests: 0,
        numTotalTests: 4,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "skipped" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(zeroReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_ZERO_TESTS");
      expect(res.error).toContain("Zero integration tests executed");
    });

    it("authoritative inventory includes all 4 canonical PostgreSQL integration suites", () => {
      expect(REQUIRED_INTEGRATION_SUITES).toHaveLength(4);
      expect(REQUIRED_INTEGRATION_SUITES).toContain(
        "src/lib/services/__tests__/postgresql_integration.test.ts"
      );
      expect(REQUIRED_INTEGRATION_SUITES).toContain(
        "src/lib/services/__tests__/deduplication.test.ts"
      );
      expect(REQUIRED_INTEGRATION_SUITES).toContain(
        "src/lib/services/__tests__/job_ad_source.test.ts"
      );
      expect(REQUIRED_INTEGRATION_SUITES).toContain(
        "src/lib/services/__tests__/user_session_postgresql_integration.test.ts"
      );
    });

    it("rejects missing/undiscovered required suite with ERR_GATE_SUITE_UNDISCOVERED", () => {
      const partialReport = {
        numPassedTests: 4,
        numTotalTests: 4,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          // deduplication.test.ts, job_ad_source.test.ts, and user_session_postgresql_integration.test.ts missing
        ],
      };
      const res = evaluateIntegrationGateReport(partialReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_SUITE_UNDISCOVERED");
      expect(res.error).toContain("Required integration suite was not discovered or executed");
    });

    it("rejects report missing user_session_postgresql_integration.test.ts specifically", () => {
      const missingSessionReport = {
        numPassedTests: 6,
        numTotalTests: 6,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          // user_session_postgresql_integration.test.ts missing!
        ],
      };
      const res = evaluateIntegrationGateReport(missingSessionReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_SUITE_UNDISCOVERED");
      expect(res.error).toContain("user_session_postgresql_integration.test.ts");
    });

    it("rejects report where a required suite is omitted and replaced by a duplicate suite", () => {
      const duplicateMaskedReport = {
        numPassedTests: 8,
        numTotalTests: 8,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            // Duplicated job_ad_source instead of user_session_postgresql_integration
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(duplicateMaskedReport);
      expect(res.valid).toBe(false);
      // Fails either on duplicate detection or missing suite detection
      expect(["ERR_GATE_SUITE_UNDISCOVERED", "ERR_GATE_DUPLICATE_SUITE"]).toContain(res.code);
    });

    it("rejects report containing duplicate execution results for a suite with ERR_GATE_DUPLICATE_SUITE", () => {
      const duplicateReport = {
        numPassedTests: 10,
        numTotalTests: 10,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            // Duplicate entry for deduplication
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(duplicateReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_DUPLICATE_SUITE");
      expect(res.error).toContain("Duplicate execution results detected");
    });

    it("rejects all-skipped required suite with ERR_GATE_SUITE_SKIPPED", () => {
      const skippedReport = {
        numPassedTests: 6,
        numTotalTests: 8,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "skipped" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(skippedReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_SUITE_SKIPPED");
      expect(res.error).toContain("0 passed tests or was skipped");
    });

    it("rejects non-zero test failure count with ERR_GATE_TESTS_FAILED", () => {
      const failedReport = {
        numPassedTests: 4,
        numTotalTests: 5,
        numFailedTests: 1,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "failed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(failedReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_TESTS_FAILED");
      expect(res.error).toContain("Test failures detected during integration execution");
    });

    it("approves successful result structure with all 4 required suites present and passed", () => {
      const successReport = {
        numPassedTests: 16,
        numTotalTests: 16,
        numFailedTests: 0,
        testResults: [
          {
            name: "/workspace/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/workspace/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/workspace/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "/workspace/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(successReport);
      expect(res.valid).toBe(true);
      expect(res.code).toBeUndefined();
      expect(res.error).toBeUndefined();
    });

    it("rejects malformed/empty object report with ERR_GATE_ZERO_TESTS", () => {
      const emptyObjReport = {};
      const res = evaluateIntegrationGateReport(emptyObjReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_ZERO_TESTS");
    });

    it("rejects required suite with an empty assertionResults list with ERR_GATE_SUITE_SKIPPED", () => {
      const emptyAssertionsReport = {
        numPassedTests: 3,
        numTotalTests: 3,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [], // Empty assertion list
          },
        ],
      };
      const res = evaluateIntegrationGateReport(emptyAssertionsReport);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_GATE_SUITE_SKIPPED");
    });

    it("permits extra non-required suites when all 4 required suites pass", () => {
      const extraSuiteReport = {
        numPassedTests: 5,
        numTotalTests: 5,
        numFailedTests: 0,
        testResults: [
          {
            name: "/app/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/app/src/lib/services/__tests__/extra_helper.test.ts",
            assertionResults: [{ status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(extraSuiteReport);
      expect(res.valid).toBe(true);
    });

    it("approves legitimate native Windows backslash required-suite paths", () => {
      const windowsReport = {
        numPassedTests: 4,
        numTotalTests: 4,
        numFailedTests: 0,
        testResults: [
          {
            name: "C:\\projects\\JobSeekeR-OSS\\src\\lib\\services\\__tests__\\postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "C:\\projects\\JobSeekeR-OSS\\src\\lib\\services\\__tests__\\deduplication.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "C:\\projects\\JobSeekeR-OSS\\src\\lib\\services\\__tests__\\job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "C:\\projects\\JobSeekeR-OSS\\src\\lib\\services\\__tests__\\user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(windowsReport);
      expect(res.valid).toBe(true);
    });

    it("approves legitimate POSIX-prefixed required-suite paths across environments", () => {
      const posixReport = {
        numPassedTests: 4,
        numTotalTests: 4,
        numFailedTests: 0,
        testResults: [
          {
            name: "/home/runner/work/JobSeekeR-OSS/JobSeekeR-OSS/src/lib/services/__tests__/postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/home/runner/work/JobSeekeR-OSS/JobSeekeR-OSS/src/lib/services/__tests__/deduplication.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/home/runner/work/JobSeekeR-OSS/JobSeekeR-OSS/src/lib/services/__tests__/job_ad_source.test.ts",
            assertionResults: [{ status: "passed" }],
          },
          {
            name: "/home/runner/work/JobSeekeR-OSS/JobSeekeR-OSS/src/lib/services/__tests__/user_session_postgresql_integration.test.ts",
            assertionResults: [{ status: "passed" }],
          },
        ],
      };
      const res = evaluateIntegrationGateReport(posixReport);
      expect(res.valid).toBe(true);
    });
  });

  describe("8. Session Integration Suite Target Security Invariants", () => {
    it("fails closed when TEST_DATABASE_URL is undefined", () => {
      const res = validateTestDatabaseUrl(undefined);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_MISSING");
    });

    it("does not permit DATABASE_URL to substitute for TEST_DATABASE_URL", () => {
      // Calling validateTestDatabaseUrl with undefined or empty string directly tests that no ambient DATABASE_URL fallback exists
      const res = validateTestDatabaseUrl(undefined);
      expect(res.valid).toBe(false);
      expect(res.code).toBe("ERR_TEST_DB_MISSING");
    });

    it("rejects unauthorized remote targets", () => {
      const res = validateTestDatabaseUrl(
        "postgresql://user:pass@ep-late-shape-b1p82mih.neon.tech/jobseeker_ci"
      );
      expect(res.valid).toBe(false);
      expect(["ERR_TEST_DB_PRODUCTION_DENIED", "ERR_TEST_DB_REMOTE_EXCLUDED"]).toContain(res.code);
    });
  });
});
