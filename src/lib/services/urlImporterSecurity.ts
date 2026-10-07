import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";

export class SsrfSecurityError extends Error {
  isSsrfError = true;
  constructor(message: string) {
    super(message);
    this.name = "SsrfSecurityError";
  }
}

/**
 * Checks whether an IPv4 address falls within private, reserved, loopback,
 * multicast, link-local, or cloud-metadata ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat unparseable IPv4 addresses as unsafe
  }
  const [a, b, c] = parts;
  // 0.0.0.0/8 - Current network (RFC 1122)
  if (a === 0) return true;
  // 10.0.0.0/8 - Private-use (RFC 1918)
  if (a === 10) return true;
  // 100.64.0.0/10 - Shared Address Space / CGNAT (RFC 6598)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 - Loopback (RFC 1122)
  if (a === 127) return true;
  // 169.254.0.0/16 - Link-Local / Cloud Metadata (RFC 3927)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 - Private-use (RFC 1918)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 - IETF Protocol Assignments (RFC 6890)
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.0.2.0/24 - TEST-NET-1 Documentation (RFC 5737)
  if (a === 192 && b === 0 && c === 2) return true;
  // 192.88.99.0/24 - 6to4 Relay Anycast (RFC 7526)
  if (a === 192 && b === 88 && c === 99) return true;
  // 192.168.0.0/16 - Private-use (RFC 1918)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 - Benchmarking (RFC 2544)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 - TEST-NET-2 Documentation (RFC 5737)
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 - TEST-NET-3 Documentation (RFC 5737)
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 - Multicast (RFC 5771) & 240.0.0.0/4 - Reserved (RFC 1112) & 255.255.255.255 Broadcast
  if (a >= 224) return true;

  return false;
}

/**
 * Checks whether an IPv6 address falls within loopback, unique-local, link-local,
 * multicast, or IPv4-mapped private ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const clean = ip.toLowerCase().replace(/^\[|\]$/g, "");
  // IPv4-mapped IPv6 address (::ffff:x.x.x.x or ::ffff:hex:hex)
  if (clean.startsWith("::ffff:")) {
    const v4 = clean.slice(7);
    if (net.isIPv4(v4)) return isPrivateOrReservedIPv4(v4);
    const hexParts = v4.split(":");
    if (hexParts.length === 2) {
      const p1 = parseInt(hexParts[0], 16);
      const p2 = parseInt(hexParts[1], 16);
      const reconstructed = `${(p1 >> 8) & 0xff}.${p1 & 0xff}.${(p2 >> 8) & 0xff}.${p2 & 0xff}`;
      if (net.isIPv4(reconstructed)) return isPrivateOrReservedIPv4(reconstructed);
    }
    return true;
  }
  // Unspecified & Loopback
  if (
    clean === "::" ||
    clean === "::1" ||
    clean === "0:0:0:0:0:0:0:0" ||
    clean === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }
  // Unique Local Address fc00::/7 (fc00 - fdff)
  if (/^f[cd][0-9a-f]{2}:/i.test(clean) || /^f[cd]::/i.test(clean)) return true;
  // Link-Local Unicast fe80::/10 (fe80 - febf)
  if (/^fe[89ab][0-9a-f]:/i.test(clean) || /^fe[89ab]::/i.test(clean)) return true;
  // Multicast ff00::/8
  if (/^ff[0-9a-f]{2}:/i.test(clean) || /^ff::/i.test(clean)) return true;
  // Documentation 2001:db8::/32
  if (/^2001:db8:/i.test(clean)) return true;
  // Discard 100::/64
  if (/^100::/i.test(clean)) return true;

  return false;
}

/**
 * Validates any IP address (IPv4 or IPv6) against private/reserved address lists.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, "");
  if (net.isIPv4(clean)) return isPrivateOrReservedIPv4(clean);
  if (net.isIPv6(clean)) return isPrivateOrReservedIPv6(clean);
  return true; // Any unparseable string is treated as unsafe
}

const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);
const FORBIDDEN_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".corp",
  ".home",
  ".intra",
  ".invalid",
  ".test",
];

/**
 * Validates URL structure, protocol, credentials, allowed port, and hostname rules.
 */
export function validateUrlBasics(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new SsrfSecurityError("Invalid URL format.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfSecurityError(
      `Forbidden protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`
    );
  }

  if (parsed.username || parsed.password) {
    throw new SsrfSecurityError("URLs containing user credentials are not permitted.");
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new SsrfSecurityError(`Port "${parsed.port}" is not permitted for job imports.`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new SsrfSecurityError("Empty hostname in URL.");
  }

  if (
    hostname === "localhost" ||
    FORBIDDEN_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new SsrfSecurityError(`Access to local/internal host "${hostname}" is forbidden.`);
  }

  // If hostname is already an IP address literal, validate immediately
  const cleanHost = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(cleanHost)) {
    if (isPrivateOrReservedIP(cleanHost)) {
      throw new SsrfSecurityError(
        `Access to private/reserved IP address "${cleanHost}" is forbidden.`
      );
    }
  }

  return parsed;
}

/**
 * Performs pre-flight DNS resolution and verifies all returned addresses.
 */
export async function resolveAndValidateDns(hostname: string): Promise<string[]> {
  const cleanHost = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(cleanHost)) {
    if (isPrivateOrReservedIP(cleanHost)) {
      throw new SsrfSecurityError(
        `Access to private or reserved IP address "${cleanHost}" is forbidden.`
      );
    }
    return [cleanHost];
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "domain unresolved";
    throw new SsrfSecurityError(`DNS lookup failed for "${hostname}": ${msg}.`);
  }

  if (!addresses || addresses.length === 0) {
    throw new SsrfSecurityError(`DNS lookup returned no IP addresses for "${hostname}".`);
  }

  const resolvedIps: string[] = [];
  for (const record of addresses) {
    if (isPrivateOrReservedIP(record.address)) {
      throw new SsrfSecurityError(
        `Hostname "${hostname}" resolved to private or reserved IP "${record.address}", which is forbidden.`
      );
    }
    resolvedIps.push(record.address);
  }

  return resolvedIps;
}

/**
 * Socket-level lookup hook for Node.js http/https client that prevents DNS rebinding attacks.
 */
export function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: Error | null, address: string | dns.LookupAddress[], family?: number) => void
): void {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    if (!addresses || addresses.length === 0) {
      return callback(
        new SsrfSecurityError(`DNS resolution returned no addresses for "${hostname}".`),
        ""
      );
    }

    for (const record of addresses) {
      if (isPrivateOrReservedIP(record.address)) {
        return callback(
          new SsrfSecurityError(
            `SSRF: Hostname "${hostname}" resolved to prohibited IP "${record.address}".`
          ),
          ""
        );
      }
    }

    if (options && (options as { all?: boolean }).all) {
      return callback(null, addresses);
    }

    return callback(null, addresses[0].address, addresses[0].family);
  });
}

export interface FetchJobPageOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
}

export interface FetchJobPageResult {
  html: string;
  finalUrl: string;
}

/**
 * Fetches HTML from a remote URL with multi-layered SSRF protection:
 * 1. URL parsing & scheme/credential/port validation
 * 2. Pre-flight DNS resolution and IP range validation
 * 3. Socket-level DNS lookup validation hook (anti-rebinding)
 * 4. Manual redirect validation loop up to maxRedirects
 * 5. Content-Type and payload size boundaries
 */
export async function fetchJobPageHtml(
  initialUrl: string,
  options: FetchJobPageOptions = {}
): Promise<FetchJobPageResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024; // 5 MB max

  let currentUrl = validateUrlBasics(initialUrl);
  await resolveAndValidateDns(currentUrl.hostname);

  let redirectCount = 0;

  while (true) {
    const isHttps = currentUrl.protocol === "https:";
    const client = isHttps ? https : http;

    const hopResult = await new Promise<{
      statusCode: number;
      headers: http.IncomingHttpHeaders;
      body: string;
    }>((resolve, reject) => {
      const req = client.request(
        currentUrl,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.1",
          },
          lookup: safeLookup as unknown as typeof dns.lookup,
          timeout: timeoutMs,
        },
        (res) => {
          const contentType = res.headers["content-type"] || "";
          if (
            contentType.includes("application/octet-stream") ||
            contentType.includes("application/zip") ||
            contentType.includes("application/pdf") ||
            contentType.startsWith("video/") ||
            contentType.startsWith("audio/")
          ) {
            req.destroy(
              new SsrfSecurityError(
                `Forbidden content-type "${contentType}". Only web pages are supported.`
              )
            );
            return;
          }

          let totalBytes = 0;
          const chunks: Buffer[] = [];

          res.on("data", (chunk: Buffer) => {
            totalBytes += chunk.length;
            if (totalBytes > maxBytes) {
              req.destroy(
                new SsrfSecurityError(`Response size exceeded limit of ${maxBytes} bytes.`)
              );
              return;
            }
            chunks.push(chunk);
          });

          res.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf-8");
            resolve({
              statusCode: res.statusCode || 200,
              headers: res.headers,
              body,
            });
          });

          res.on("error", (err) => {
            reject(err);
          });
        }
      );

      req.on("timeout", () => {
        req.destroy(new Error(`Request timed out after ${timeoutMs}ms.`));
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.end();
    });

    // Check for redirect status codes
    if ([301, 302, 303, 307, 308].includes(hopResult.statusCode)) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new SsrfSecurityError(`Too many redirects (exceeded ${maxRedirects}).`);
      }

      const location = hopResult.headers.location;
      if (!location) {
        throw new Error(`Redirect HTTP ${hopResult.statusCode} missing Location header.`);
      }

      // Resolve relative redirect against current URL
      const nextUrlString = new URL(location, currentUrl.href).href;
      // Validate the redirect target URL and DNS
      currentUrl = validateUrlBasics(nextUrlString);
      await resolveAndValidateDns(currentUrl.hostname);
      continue;
    }

    if (hopResult.statusCode < 200 || hopResult.statusCode >= 300) {
      throw new Error(`Failed to fetch URL (HTTP ${hopResult.statusCode})`);
    }

    return {
      html: hopResult.body,
      finalUrl: currentUrl.href,
    };
  }
}
