import { describe, expect, it } from "vitest";
import { analyzeHtml } from "../../src/modules/launchcheck/live/analyze-html.js";
import { analyzeHeaders } from "../../src/modules/launchcheck/live/headers.js";
import { fetchUrl } from "../../src/modules/launchcheck/live/fetch-url.js";
import { runLiveChecks } from "../../src/modules/launchcheck/live/lighthouse-lite.js";
import type { LaunchCheck } from "../../src/modules/launchcheck/index.js";

function buildResponse(input: {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
}): Response {
  return new Response(input.body ?? "", {
    status: input.status ?? 200,
    headers: input.headers ?? {},
  });
}

function findCheck(checks: LaunchCheck[], id: string): LaunchCheck {
  const found = checks.find((c) => c.id === id);
  if (!found) throw new Error(`expected check ${id} to be present`);
  return found;
}

describe("analyzeHtml", () => {
  it("extracts title, viewport, description, and Open Graph state", () => {
    const html = `
      <html>
        <head>
          <title>Demo Site</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="A demo." />
          <meta property="og:title" content="Demo" />
          <link rel="canonical" href="https://example.com/" />
        </head>
        <body>Hello</body>
      </html>`;

    const insights = analyzeHtml(html);
    expect(insights.title).toBe("Demo Site");
    expect(insights.hasViewport).toBe(true);
    expect(insights.hasDescription).toBe(true);
    expect(insights.hasOpenGraph).toBe(true);
    expect(insights.canonical).toBe("https://example.com/");
    expect(insights.localhostReferences).toHaveLength(0);
    expect(insights.testEnvReferences).toHaveLength(0);
  });

  it("flags localhost references and Stripe test keys", () => {
    const html = `<html><body>
      <script>const api = "http://localhost:3001/api";</script>
      <script>const k = "pk_test_ABCDEF123456";</script>
    </body></html>`;

    const insights = analyzeHtml(html);
    expect(insights.localhostReferences.length).toBeGreaterThan(0);
    expect(insights.testEnvReferences).toContain(
      "Stripe test key (pk_test_)",
    );
  });

  it("reports an empty title as missing", () => {
    const insights = analyzeHtml(`<html><head><title>   </title></head></html>`);
    expect(insights.title).toBeNull();
  });
});

describe("analyzeHeaders", () => {
  it("detects HTML content-type, compression, and cache-control", () => {
    const headers = new Map([
      ["content-type", "text/html; charset=utf-8"],
      ["content-encoding", "br"],
      ["cache-control", "public, max-age=60"],
      ["content-length", "1234"],
    ]);

    const insights = analyzeHeaders(headers);
    expect(insights.isHtml).toBe(true);
    expect(insights.hasCompression).toBe(true);
    expect(insights.hasCacheControl).toBe(true);
    expect(insights.contentLength).toBe(1234);
  });

  it("returns falsy flags when headers are absent", () => {
    const insights = analyzeHeaders(new Map());
    expect(insights.isHtml).toBe(false);
    expect(insights.hasCompression).toBe(false);
    expect(insights.hasCacheControl).toBe(false);
    expect(insights.contentType).toBeNull();
  });
});

describe("fetchUrl", () => {
  it("returns success outcome with timing and headers", async () => {
    const result = await fetchUrl("https://example.com/", {
      fetchImpl: async () =>
        buildResponse({
          status: 200,
          body: "<html></html>",
          headers: { "content-type": "text/html" },
        }),
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.status).toBe(200);
      expect(result.headers.get("content-type")).toBe("text/html");
      expect(result.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns an error outcome when fetch throws", async () => {
    const result = await fetchUrl("https://example.com/", {
      fetchImpl: async () => {
        throw new Error("ECONNREFUSED");
      },
    });

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.error).toMatch(/ECONNREFUSED/);
    }
  });
});

describe("runLiveChecks", () => {
  it("produces all expected checks for a healthy HTML response", async () => {
    const checks = await runLiveChecks({
      url: "https://example.com/",
      fetchImpl: async () =>
        buildResponse({
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "content-encoding": "br",
            "cache-control": "public, max-age=60",
          },
          body: `
            <html>
              <head>
                <title>Healthy</title>
                <meta name="viewport" content="..." />
                <meta name="description" content="..." />
                <meta property="og:title" content="Healthy" />
                <meta property="og:description" content="..." />
                <link rel="canonical" href="https://example.com/" />
              </head>
              <body>OK</body>
            </html>`,
        }),
    });

    expect(findCheck(checks, "live-reachable").status).toBe("pass");
    expect(findCheck(checks, "live-status").status).toBe("pass");
    expect(findCheck(checks, "live-content-type").status).toBe("pass");
    expect(findCheck(checks, "live-title").status).toBe("pass");
    expect(findCheck(checks, "live-meta-description").status).toBe("pass");
    expect(findCheck(checks, "live-viewport").status).toBe("pass");
    expect(findCheck(checks, "live-open-graph").status).toBe("pass");
    expect(findCheck(checks, "live-canonical").status).toBe("pass");
    expect(findCheck(checks, "live-cache-control").status).toBe("pass");
    expect(findCheck(checks, "live-compression").status).toBe("pass");
    expect(findCheck(checks, "live-no-localhost").status).toBe("pass");
    expect(findCheck(checks, "live-no-test-env").status).toBe("pass");
  });

  it("fails reachability when fetch errors out", async () => {
    const checks = await runLiveChecks({
      url: "https://nope.invalid/",
      fetchImpl: async () => {
        throw new Error("DNS lookup failed");
      },
    });

    expect(checks).toHaveLength(1);
    expect(checks[0].id).toBe("live-reachable");
    expect(checks[0].status).toBe("fail");
    expect(checks[0].message).toMatch(/DNS lookup failed/);
  });

  it("fails on non-200 status and non-HTML content-type", async () => {
    const checks = await runLiveChecks({
      url: "https://example.com/",
      fetchImpl: async () =>
        buildResponse({
          status: 404,
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
    });

    expect(findCheck(checks, "live-status").status).toBe("fail");
    expect(findCheck(checks, "live-content-type").status).toBe("fail");
    // No HTML-specific checks should fire when content-type is not text/html
    expect(checks.find((c) => c.id === "live-title")).toBeUndefined();
  });

  it("warns on missing description, viewport, OG, canonical, cache, compression", async () => {
    const checks = await runLiveChecks({
      url: "https://example.com/",
      fetchImpl: async () =>
        buildResponse({
          status: 200,
          headers: { "content-type": "text/html" },
          body: `<html><head><title>Bare</title></head><body></body></html>`,
        }),
    });

    expect(findCheck(checks, "live-meta-description").status).toBe("warn");
    expect(findCheck(checks, "live-viewport").status).toBe("warn");
    expect(findCheck(checks, "live-open-graph").status).toBe("warn");
    expect(findCheck(checks, "live-canonical").status).toBe("warn");
    expect(findCheck(checks, "live-cache-control").status).toBe("warn");
    expect(findCheck(checks, "live-compression").status).toBe("warn");
  });

  it("fails when HTML contains localhost references", async () => {
    const checks = await runLiveChecks({
      url: "https://example.com/",
      fetchImpl: async () =>
        buildResponse({
          status: 200,
          headers: { "content-type": "text/html" },
          body: `<html><body><script>const u="http://localhost:3000/api"</script></body></html>`,
        }),
    });

    expect(findCheck(checks, "live-no-localhost").status).toBe("fail");
  });

  it("warns when HTML contains Stripe test keys", async () => {
    const checks = await runLiveChecks({
      url: "https://example.com/",
      fetchImpl: async () =>
        buildResponse({
          status: 200,
          headers: { "content-type": "text/html" },
          body: `<html><body><script>const k="pk_test_ABCDEFGHIJ"</script></body></html>`,
        }),
    });

    expect(findCheck(checks, "live-no-test-env").status).toBe("warn");
  });
});
