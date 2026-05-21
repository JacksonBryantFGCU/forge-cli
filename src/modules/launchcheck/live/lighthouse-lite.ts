import type { LaunchCheck } from "../types.js";
import { analyzeHtml } from "./analyze-html.js";
import { analyzeHeaders } from "./headers.js";
import { fetchUrl, type FetchImpl } from "./fetch-url.js";

const MAX_HTML_BYTES = 1_000_000;
const SLOW_TTFB_MS = 800;

export type LiveCheckOptions = {
  url: string;
  fetchImpl?: FetchImpl;
  timeoutMs?: number;
};

export async function runLiveChecks(
  options: LiveCheckOptions,
): Promise<LaunchCheck[]> {
  const checks: LaunchCheck[] = [];

  const result = await fetchUrl(options.url, {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
  });

  if (result.kind === "error") {
    checks.push({
      id: "live-reachable",
      title: "Deployment URL is reachable",
      status: "fail",
      message: `Could not fetch ${options.url}: ${result.error}`,
    });
    return checks;
  }

  checks.push({
    id: "live-reachable",
    title: "Deployment URL is reachable",
    status: "pass",
    message: `Fetched ${options.url} in ${result.totalMs}ms (TTFB ${result.ttfbMs}ms).`,
  });

  checks.push({
    id: "live-status",
    title: "HTTP status is 200",
    status: result.status === 200 ? "pass" : "fail",
    message:
      result.status === 200 ? undefined : `Got HTTP ${result.status}.`,
  });

  const headers = analyzeHeaders(result.headers);

  checks.push({
    id: "live-content-type",
    title: "Content-Type is text/html",
    status: headers.isHtml ? "pass" : "fail",
    message: headers.isHtml
      ? undefined
      : `Got Content-Type "${headers.contentType ?? "(none)"}".`,
  });

  // Only run HTML-shape checks if we actually got HTML.
  if (headers.isHtml) {
    const html = analyzeHtml(result.body);

    checks.push({
      id: "live-title",
      title: "HTML <title> is present",
      status: html.title ? "pass" : "fail",
      message: html.title
        ? `Title: "${html.title}"`
        : "Page has no non-empty <title>.",
    });

    checks.push({
      id: "live-meta-description",
      title: "Meta description present",
      status: html.hasDescription ? "pass" : "warn",
      message: html.hasDescription
        ? undefined
        : "Add a meta description for better search previews.",
    });

    checks.push({
      id: "live-viewport",
      title: "Viewport meta tag present",
      status: html.hasViewport ? "pass" : "warn",
      message: html.hasViewport
        ? undefined
        : "Add a viewport meta tag for responsive behavior.",
    });

    checks.push({
      id: "live-open-graph",
      title: "Open Graph metadata present",
      status: html.hasOpenGraph ? "pass" : "warn",
      message: html.hasOpenGraph
        ? undefined
        : "Add og:title and og:description for shareable previews.",
    });

    checks.push({
      id: "live-canonical",
      title: "Canonical URL present",
      status: html.canonical ? "pass" : "warn",
      message: html.canonical
        ? `Canonical: ${html.canonical}`
        : "Add a <link rel=\"canonical\"> to disambiguate URLs for search engines.",
    });

    checks.push({
      id: "live-payload-size",
      title: "HTML payload under 1 MB",
      status: html.bodyBytes <= MAX_HTML_BYTES ? "pass" : "warn",
      message:
        html.bodyBytes <= MAX_HTML_BYTES
          ? `HTML is ${formatBytes(html.bodyBytes)}.`
          : `HTML is ${formatBytes(html.bodyBytes)} — consider trimming inline assets.`,
    });

    checks.push({
      id: "live-no-localhost",
      title: "No localhost references in HTML",
      status: html.localhostReferences.length === 0 ? "pass" : "fail",
      message:
        html.localhostReferences.length === 0
          ? undefined
          : `Found ${html.localhostReferences.length} localhost reference(s): ${html.localhostReferences.slice(0, 3).join(", ")}`,
    });

    checks.push({
      id: "live-no-test-env",
      title: "No obvious test/sandbox env references",
      status: html.testEnvReferences.length === 0 ? "pass" : "warn",
      message:
        html.testEnvReferences.length === 0
          ? undefined
          : `Found test/sandbox markers: ${html.testEnvReferences.join(", ")}`,
    });
  }

  checks.push({
    id: "live-cache-control",
    title: "Cache-Control header present",
    status: headers.hasCacheControl ? "pass" : "warn",
    message: headers.hasCacheControl
      ? `Cache-Control: ${headers.cacheControl}`
      : "No Cache-Control header. Set explicit caching at the edge.",
  });

  checks.push({
    id: "live-compression",
    title: "Response is compressed",
    status: headers.hasCompression ? "pass" : "warn",
    message: headers.hasCompression
      ? `Content-Encoding: ${headers.contentEncoding}`
      : "No gzip/br compression detected. Enable compression at the edge.",
  });

  checks.push({
    id: "live-ttfb",
    title: "Time to first byte under 800ms",
    status: result.ttfbMs <= SLOW_TTFB_MS ? "pass" : "warn",
    message:
      result.ttfbMs <= SLOW_TTFB_MS
        ? `TTFB: ${result.ttfbMs}ms`
        : `TTFB is ${result.ttfbMs}ms — slower than ${SLOW_TTFB_MS}ms. Investigate caching or cold starts.`,
  });

  return checks;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}
