export type FetchSuccess = {
  kind: "ok";
  status: number;
  headers: Map<string, string>;
  body: string;
  ttfbMs: number;
  totalMs: number;
};

export type FetchFailure = {
  kind: "error";
  error: string;
};

export type FetchOutcome = FetchSuccess | FetchFailure;

export type FetchImpl = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export type FetchUrlOptions = {
  fetchImpl?: FetchImpl;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchUrl(
  url: string,
  options: FetchUrlOptions = {},
): Promise<FetchOutcome> {
  const fetcher = options.fetchImpl ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    return {
      kind: "error",
      error: "fetch is not available in this Node runtime.",
    };
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetcher(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "forge-launch/0.1" },
    });
    const headersArrived = Date.now();

    const body = await response.text();
    const finished = Date.now();

    const headers = new Map<string, string>();
    response.headers.forEach((value, name) => {
      headers.set(name.toLowerCase(), value);
    });

    return {
      kind: "ok",
      status: response.status,
      headers,
      body,
      ttfbMs: headersArrived - started,
      totalMs: finished - started,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      kind: "error",
      error: controller.signal.aborted
        ? `Request timed out after ${timeoutMs}ms`
        : message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
