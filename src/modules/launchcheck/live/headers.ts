export type HeaderInsights = {
  contentType: string | null;
  cacheControl: string | null;
  contentEncoding: string | null;
  contentLength: number | null;
  isHtml: boolean;
  hasCompression: boolean;
  hasCacheControl: boolean;
};

const COMPRESSION_VALUES = new Set(["gzip", "br", "deflate", "zstd"]);

export function analyzeHeaders(headers: Map<string, string>): HeaderInsights {
  const contentType = headers.get("content-type") ?? null;
  const cacheControl = headers.get("cache-control") ?? null;
  const contentEncoding = headers.get("content-encoding") ?? null;
  const rawLength = headers.get("content-length");
  const contentLength = rawLength ? Number(rawLength) : null;

  const isHtml = contentType
    ? contentType.toLowerCase().startsWith("text/html")
    : false;

  const hasCompression = contentEncoding
    ? contentEncoding
        .toLowerCase()
        .split(/,\s*/)
        .some((value) => COMPRESSION_VALUES.has(value))
    : false;

  const hasCacheControl = Boolean(
    cacheControl && cacheControl.trim().length > 0,
  );

  return {
    contentType,
    cacheControl,
    contentEncoding,
    contentLength: Number.isFinite(contentLength) ? contentLength : null,
    isHtml,
    hasCompression,
    hasCacheControl,
  };
}
