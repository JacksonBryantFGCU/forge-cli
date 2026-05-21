/**
 * Insert a `<meta>` tag (or any single-line snippet) on its own line just
 * before the first closing `</head>`. The new tag is indented two spaces
 * deeper than the `</head>` itself. Returns null when `</head>` is missing.
 */
export function insertIntoHead(html: string, tag: string): string | null {
  const match = html.match(/^([ \t]*)<\/head>/m);
  if (!match) return null;

  const indent = match[1] ?? "";
  const insertAt = html.indexOf(match[0]);
  const lineIndent = `${indent}  `;

  return (
    html.slice(0, insertAt) +
    lineIndent +
    tag +
    "\n" +
    html.slice(insertAt)
  );
}

export function htmlHasMeta(html: string, name: string): boolean {
  const pattern = new RegExp(`<meta[^>]+name=["']${name}["']`, "i");
  return pattern.test(html);
}

export function htmlHasOgTags(html: string): boolean {
  return /<meta[^>]+property=["']og:(title|description)["']/i.test(html);
}
