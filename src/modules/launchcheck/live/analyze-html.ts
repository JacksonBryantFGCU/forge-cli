export type HtmlInsights = {
  title: string | null;
  hasViewport: boolean;
  hasDescription: boolean;
  hasOpenGraph: boolean;
  canonical: string | null;
  bodyBytes: number;
  localhostReferences: string[];
  testEnvReferences: string[];
};

const LOCALHOST_PATTERNS = [
  /localhost(?::\d+)?/gi,
  /127\.0\.0\.1(?::\d+)?/g,
];

const TEST_ENV_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Stripe test key (pk_test_)", pattern: /pk_test_[A-Za-z0-9]{4,}/g },
  { label: "Stripe test key (sk_test_)", pattern: /sk_test_[A-Za-z0-9]{4,}/g },
  { label: "Square sandbox", pattern: /squareupsandbox\.com/gi },
  { label: "Square sandbox env", pattern: /SQUARE_ENVIRONMENT["']?:\s*["']sandbox/gi },
  { label: "Supabase local URL", pattern: /supabase\.co.*?test/gi },
];

function uniqueMatches(input: string, patterns: RegExp[]): string[] {
  const found = new Set<string>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(input)) !== null) {
      found.add(match[0]);
      if (found.size >= 8) break;
    }
  }
  return Array.from(found);
}

function matchAttribute(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  if (!match) return null;
  const value = match[1];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function analyzeHtml(html: string): HtmlInsights {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasDescription = /<meta[^>]+name=["']description["']/i.test(html);
  const hasOpenGraph =
    /<meta[^>]+property=["']og:(title|description)["']/i.test(html);

  const canonical = matchAttribute(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  );

  const localhost = uniqueMatches(html, LOCALHOST_PATTERNS);
  const testEnv = TEST_ENV_PATTERNS.flatMap((entry) => {
    entry.pattern.lastIndex = 0;
    return entry.pattern.test(html) ? [entry.label] : [];
  });

  return {
    title: title && title.length > 0 ? title : null,
    hasViewport,
    hasDescription,
    hasOpenGraph,
    canonical,
    bodyBytes: Buffer.byteLength(html, "utf8"),
    localhostReferences: localhost,
    testEnvReferences: Array.from(new Set(testEnv)),
  };
}
