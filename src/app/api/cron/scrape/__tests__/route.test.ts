import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getAuthenticatedUser } from "@/lib/authHelper";
import { fetchSwedishJobs } from "@/lib/services/jobtech";
import { ensureV2ProfilesExist } from "@/lib/services/pipeline/seedV2";

// Mock authHelper
vi.mock("@/lib/authHelper", () => ({
  getAuthenticatedUser: vi.fn(),
}));

// Mock database and underlying services to keep unit tests fast, isolated, and safe
vi.mock("@/lib/db", () => ({
  db: {
    searchProfile: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    careerProfile: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    jobAd: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    scanLog: {
      create: vi.fn().mockResolvedValue({ id: "log_1", scannedAt: new Date() }),
    },
  },
}));

vi.mock("@/lib/services/jobtech", () => ({
  fetchSwedishJobs: vi.fn().mockResolvedValue([]),
  jobTechAdToSourceVacancy: vi.fn(),
}));

vi.mock("@/lib/services/linkedin", () => ({
  fetchLinkedInSwedishJobs: vi.fn().mockResolvedValue([]),
  linkedInAdToSourceVacancy: vi.fn(),
}));

vi.mock("@/lib/services/webbjobb", () => ({
  fetchWebbjobbVacancies: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/services/pipeline/seedV2", () => ({
  ensureV2ProfilesExist: vi.fn().mockResolvedValue(undefined),
}));

describe("Scraper Cron Route Authorization and Handlers (/api/cron/scrape)", () => {
  const originalEnv = process.env.CRON_SECRET;
  const mockUser = {
    id: "usr_123",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CRON_SECRET = originalEnv;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  describe("Scheduled Cron Bearer Token Authorization", () => {
    it("authorizes request when valid Bearer token matching CRON_SECRET is provided", async () => {
      process.env.CRON_SECRET = "test_cron_secret_123";
      const req = new NextRequest("http://localhost:3000/api/cron/scrape", {
        method: "GET",
        headers: {
          authorization: "Bearer test_cron_secret_123",
        },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(ensureV2ProfilesExist).toHaveBeenCalled();
    });

    it("rejects request with HTTP 401 Unauthorized when Bearer token does not match CRON_SECRET", async () => {
      process.env.CRON_SECRET = "test_cron_secret_123";
      const req = new NextRequest("http://localhost:3000/api/cron/scrape", {
        method: "GET",
        headers: {
          authorization: "Bearer wrong_secret",
        },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ success: false, error: "Unauthorized" });
      expect(ensureV2ProfilesExist).not.toHaveBeenCalled();
    });

    it("fails closed with HTTP 401 Unauthorized when CRON_SECRET is not configured and no user session exists", async () => {
      delete process.env.CRON_SECRET;
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/cron/scrape", { method: "GET" });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ success: false, error: "Unauthorized" });
      expect(ensureV2ProfilesExist).not.toHaveBeenCalled();
    });
  });

  describe("Manual UI Trigger Database-Backed Session Authorization", () => {
    it("authorizes POST manual trigger when valid server-verified user session is present in DB", async () => {
      process.env.CRON_SECRET = "test_cron_secret_123";
      vi.mocked(getAuthenticatedUser).mockResolvedValue(mockUser);

      const validRawToken = "a".repeat(64);
      const req = new NextRequest("http://localhost:3000/api/cron/scrape", {
        method: "POST",
        headers: {
          "x-jobseeker-trigger": "manual",
          cookie: `jobseeker_session=${validRawToken}`,
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(getAuthenticatedUser).toHaveBeenCalledWith(req);
      expect(ensureV2ProfilesExist).toHaveBeenCalled();
    });

    it("rejects marker-only manual trigger with HTTP 401 when no session cookie is provided", async () => {
      process.env.CRON_SECRET = "test_cron_secret_123";
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/cron/scrape", {
        method: "POST",
        headers: {
          "x-jobseeker-trigger": "manual",
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ success: false, error: "Unauthorized" });
      expect(ensureV2ProfilesExist).not.toHaveBeenCalled();
    });

    it("rejects manual trigger with HTTP 401 when session token is malformed or invalid hex length", async () => {
      process.env.CRON_SECRET = "test_cron_secret_123";
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/cron/scrape", {
        method: "POST",
        headers: {
          "x-jobseeker-trigger": "manual",
          cookie: "jobseeker_session=invalid_short_token",
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ success: false, error: "Unauthorized" });
      expect(ensureV2ProfilesExist).not.toHaveBeenCalled();
    });

    it("rejects request with HTTP 401 when neither authorization header nor valid session is present", async () => {
      process.env.CRON_SECRET = "test_cron_secret_123";
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/cron/scrape", { method: "POST" });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ success: false, error: "Unauthorized" });
      expect(fetchSwedishJobs).not.toHaveBeenCalled();
    });
  });
});
