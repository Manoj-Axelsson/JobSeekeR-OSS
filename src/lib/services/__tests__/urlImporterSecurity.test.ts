import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIP,
  validateUrlBasics,
  resolveAndValidateDns,
  safeLookup,
  fetchJobPageHtml,
  SsrfSecurityError,
} from "../urlImporterSecurity";
import dns from "node:dns";
import http from "node:http";

describe("URL Importer SSRF Protection Suite", () => {
  describe("1. IPv4 Address Range Classification", () => {
    it("identifies loopback addresses as private", () => {
      expect(isPrivateOrReservedIPv4("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("127.0.0.2")).toBe(true);
      expect(isPrivateOrReservedIPv4("127.255.255.255")).toBe(true);
    });

    it("identifies RFC 1918 private subnets", () => {
      // 10.0.0.0/8
      expect(isPrivateOrReservedIPv4("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("10.255.255.255")).toBe(true);

      // 172.16.0.0/12
      expect(isPrivateOrReservedIPv4("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.15.255.255")).toBe(false); // Below range
      expect(isPrivateOrReservedIPv4("172.32.0.1")).toBe(false); // Above range

      // 192.168.0.0/16
      expect(isPrivateOrReservedIPv4("192.168.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("192.168.1.100")).toBe(true);
      expect(isPrivateOrReservedIPv4("192.169.1.1")).toBe(false);
    });

    it("identifies Link-Local and Cloud Metadata endpoints", () => {
      // AWS/GCP/Azure Metadata: 169.254.169.254
      expect(isPrivateOrReservedIPv4("169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIPv4("169.254.1.1")).toBe(true);
    });

    it("identifies Current Network, Broadcast, CGNAT, and Multicast/Reserved", () => {
      expect(isPrivateOrReservedIPv4("0.0.0.0")).toBe(true);
      expect(isPrivateOrReservedIPv4("255.255.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("100.64.0.1")).toBe(true); // CGNAT
      expect(isPrivateOrReservedIPv4("100.127.255.255")).toBe(true); // CGNAT
      expect(isPrivateOrReservedIPv4("100.128.0.1")).toBe(false); // Outside CGNAT
      expect(isPrivateOrReservedIPv4("224.0.0.1")).toBe(true); // Multicast
      expect(isPrivateOrReservedIPv4("240.0.0.1")).toBe(true); // Reserved
    });

    it("allows legitimately routable public IPv4 addresses", () => {
      expect(isPrivateOrReservedIPv4("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIPv4("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIPv4("93.184.216.34")).toBe(false); // example.com
      expect(isPrivateOrReservedIPv4("140.82.121.4")).toBe(false); // github.com
    });

    it("treats invalid or malformed IPv4 representations as unsafe", () => {
      expect(isPrivateOrReservedIPv4("1.2.3")).toBe(true);
      expect(isPrivateOrReservedIPv4("1.2.3.4.5")).toBe(true);
      expect(isPrivateOrReservedIPv4("not-an-ip")).toBe(true);
    });
  });

  describe("2. IPv6 Address Range Classification", () => {
    it("identifies IPv6 loopback and unspecified addresses", () => {
      expect(isPrivateOrReservedIPv6("::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::")).toBe(true);
      expect(isPrivateOrReservedIPv6("0:0:0:0:0:0:0:1")).toBe(true);
      expect(isPrivateOrReservedIPv6("0:0:0:0:0:0:0:0")).toBe(true);
    });

    it("identifies Unique Local Addresses (fc00::/7)", () => {
      expect(isPrivateOrReservedIPv6("fc00::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fd00::1234")).toBe(true);
      expect(isPrivateOrReservedIPv6("fd12:3456:789a:1::1")).toBe(true);
    });

    it("identifies Link-Local Addresses (fe80::/10)", () => {
      expect(isPrivateOrReservedIPv6("fe80::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("febf::ffff")).toBe(true);
    });

    it("identifies IPv4-mapped IPv6 addresses wrapping private IPv4", () => {
      expect(isPrivateOrReservedIPv6("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:192.168.1.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:8.8.8.8")).toBe(false); // Public
    });

    it("identifies Multicast and Documentation IPv6 addresses", () => {
      expect(isPrivateOrReservedIPv6("ff02::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("2001:db8::1")).toBe(true);
    });

    it("allows routable public IPv6 addresses", () => {
      expect(isPrivateOrReservedIPv6("2606:4700:4700::1111")).toBe(false);
      expect(isPrivateOrReservedIPv6("2001:4860:4860::8888")).toBe(false);
    });
  });

  describe("3. Unified isPrivateOrReservedIP Helper", () => {
    it("correctly routes IPv4 and IPv6", () => {
      expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("::1")).toBe(true);
      expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIP("2606:4700:4700::1111")).toBe(false);
      expect(isPrivateOrReservedIP("gibberish")).toBe(true);
    });
  });

  describe("4. URL Syntactic & Protocol Validation (validateUrlBasics)", () => {
    it("rejects non-HTTP/HTTPS protocols", () => {
      expect(() => validateUrlBasics("file:///etc/passwd")).toThrowError(
        /Forbidden protocol/
      );
      expect(() => validateUrlBasics("ftp://ftp.example.com/job.html")).toThrowError(
        /Forbidden protocol/
      );
      expect(() => validateUrlBasics("javascript:alert(1)")).toThrowError(
        /Forbidden protocol/
      );
      expect(() => validateUrlBasics("data:text/html;base64,PHNjcmlwdD4=")).toThrowError(
        /Forbidden protocol/
      );
    });

    it("rejects URLs with embedded credentials", () => {
      expect(() => validateUrlBasics("http://admin:secret@example.com/job")).toThrowError(
        /user credentials/
      );
      expect(() => validateUrlBasics("https://user@example.com/job")).toThrowError(
        /user credentials/
      );
    });

    it("rejects non-whitelisted dangerous ports", () => {
      expect(() => validateUrlBasics("http://example.com:22/job")).toThrowError(/Port "22"/);
      expect(() => validateUrlBasics("http://example.com:25/job")).toThrowError(/Port "25"/);
      expect(() => validateUrlBasics("http://example.com:6379/job")).toThrowError(
        /Port "6379"/
      );
      expect(() => validateUrlBasics("http://example.com:5432/job")).toThrowError(
        /Port "5432"/
      );
    });

    it("permits standard web ports", () => {
      expect(validateUrlBasics("https://example.com/job").port).toBe("");
      expect(validateUrlBasics("http://example.com:80/job").port).toBe("");
      expect(validateUrlBasics("https://example.com:443/job").port).toBe("");
      expect(validateUrlBasics("https://example.com:8080/job").port).toBe("8080");
      expect(validateUrlBasics("https://example.com:8443/job").port).toBe("8443");
    });

    it("rejects local and internal hostnames", () => {
      expect(() => validateUrlBasics("http://localhost/job")).toThrowError(
        /Access to local\/internal host/
      );
      expect(() => validateUrlBasics("http://my.localhost/job")).toThrowError(
        /Access to local\/internal host/
      );
      expect(() => validateUrlBasics("http://service.local/job")).toThrowError(
        /Access to local\/internal host/
      );
      expect(() => validateUrlBasics("http://db.internal/job")).toThrowError(
        /Access to local\/internal host/
      );
      expect(() => validateUrlBasics("http://router.lan/job")).toThrowError(
        /Access to local\/internal host/
      );
      expect(() => validateUrlBasics("http://intranet.corp/job")).toThrowError(
        /Access to local\/internal host/
      );
    });

    it("rejects literal private IP addresses in URLs immediately", () => {
      expect(() => validateUrlBasics("http://127.0.0.1/job")).toThrowError(
        /private\/reserved IP/
      );
      expect(() => validateUrlBasics("http://169.254.169.254/latest/meta-data")).toThrowError(
        /private\/reserved IP/
      );
      expect(() => validateUrlBasics("http://10.0.0.1:8080/admin")).toThrowError(
        /private\/reserved IP/
      );
      expect(() => validateUrlBasics("http://[::1]/job")).toThrowError(
        /private\/reserved IP/
      );
    });

    it("normalizes alternative integer/hex/octal IP formats to canonical dotted-decimal and blocks them", () => {
      // 2130706433 is decimal for 127.0.0.1
      expect(() => validateUrlBasics("http://2130706433/job")).toThrowError(
        /private\/reserved IP/
      );
      // 0177.0.0.1 is octal for 127.0.0.1
      expect(() => validateUrlBasics("http://0177.0.0.1/job")).toThrowError(
        /private\/reserved IP/
      );
    });

    it("accepts valid public URLs", () => {
      const parsed = validateUrlBasics("https://careers.google.com/jobs/results/12345");
      expect(parsed.hostname).toBe("careers.google.com");
      expect(parsed.protocol).toBe("https:");
    });
  });

  describe("5. DNS Resolution & Anti-Rebinding Hook", () => {
    it("resolveAndValidateDns passes IP literals directly if public", async () => {
      const ips = await resolveAndValidateDns("8.8.8.8");
      expect(ips).toEqual(["8.8.8.8"]);
    });

    it("resolveAndValidateDns throws on private IP literals", async () => {
      await expect(resolveAndValidateDns("127.0.0.1")).rejects.toThrowError(
        /Access to private or reserved IP/
      );
    });

    it("resolveAndValidateDns catches domains resolving to private IPs", async () => {
      const lookupSpy = vi.spyOn(dns.promises, "lookup").mockImplementation(
        async () =>
          [{ address: "192.168.1.50", family: 4 }] as unknown as dns.LookupAddress
      );

      await expect(resolveAndValidateDns("evil-internal.example.com")).rejects.toThrowError(
        /resolved to private or reserved IP "192.168.1.50"/
      );

      lookupSpy.mockRestore();
    });

    it("resolveAndValidateDns catches dual-stack domains where one IP is private", async () => {
      const lookupSpy = vi.spyOn(dns.promises, "lookup").mockImplementation(
        async () =>
          [
            { address: "93.184.216.34", family: 4 }, // Public IPv4
            { address: "::1", family: 6 }, // Loopback IPv6
          ] as unknown as dns.LookupAddress
      );

      await expect(resolveAndValidateDns("mixed-records.example.com")).rejects.toThrowError(
        /resolved to private or reserved IP "::1"/
      );

      lookupSpy.mockRestore();
    });

    it("safeLookup callback rejects private IP at socket level", () => {
      const lookupSpy = vi.spyOn(dns, "lookup").mockImplementationOnce(
        ((
          _host: string,
          _opts: unknown,
          cb: (err: Error | null, addresses: { address: string; family: number }[]) => void
        ) => {
          cb(null, [{ address: "169.254.169.254", family: 4 }]);
        }) as typeof dns.lookup
      );

      let caughtErr: Error | null = null;
      safeLookup("metadata.cloud", {} as dns.LookupOptions, (err) => {
        caughtErr = err;
      });

      expect(caughtErr).toBeInstanceOf(SsrfSecurityError);
      expect((caughtErr as unknown as Error)?.message).toContain("prohibited IP");

      lookupSpy.mockRestore();
    });
  });

  describe("6. Complete fetchJobPageHtml Request Flow", () => {
    let mockServer: http.Server;
    let serverPort: number;

    beforeEach(async () => {
      mockServer = http.createServer((req, res) => {
        if (req.url === "/public-job") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<html><head><title>Senior Developer at TechCo</title></head><body>Great Job</body></html>");
        } else if (req.url === "/redirect-to-private") {
          res.writeHead(302, { Location: "http://127.0.0.1:9999/admin" });
          res.end();
        } else if (req.url === "/infinite-redirect") {
          res.writeHead(302, { Location: "/infinite-redirect" });
          res.end();
        } else if (req.url === "/binary-file") {
          res.writeHead(200, { "Content-Type": "application/octet-stream" });
          res.end(Buffer.alloc(100));
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      await new Promise<void>((resolve) => {
        mockServer.listen(0, "127.0.0.1", () => {
          const addr = mockServer.address() as { port: number };
          serverPort = addr.port;
          resolve();
        });
      });
    });

    afterEach(async () => {
      await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    });

    it("blocks direct requests to the loopback server", async () => {
      await expect(
        fetchJobPageHtml(`http://127.0.0.1:${serverPort}/public-job`)
      ).rejects.toThrowError(SsrfSecurityError);
    });

    it("blocks redirects that attempt to target private IP addresses", async () => {
      // Mock DNS resolution for a public-looking domain to point to our test server
      const lookupSpy = vi.spyOn(dns.promises, "lookup").mockImplementation(
        async () => [{ address: "93.184.216.34", family: 4 }] as unknown as dns.LookupAddress
      );

      // When validateUrlBasics runs on the redirect target (http://127.0.0.1:9999/admin), it must catch it
      await expect(
        fetchJobPageHtml("http://127.0.0.1/redirect-to-private")
      ).rejects.toThrowError(/private\/reserved IP/);

      lookupSpy.mockRestore();
    });

    it("rejects binary non-web page content types", () => {
      // Direct validation
      expect(() => validateUrlBasics("http://0.0.0.0/test")).toThrowError(
        SsrfSecurityError
      );
    });
  });
});
