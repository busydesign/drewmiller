/** Strip import-source footers accidentally baked into listing copy. */
export function stripImportFooter(text: string | null | undefined): string | null {
  if (!text?.trim()) return text?.trim() ? text : null;
  const cleaned = text
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^Imported from\b/i.test(t)) return false;
      if (/^https?:\/\/(www\.)?homes\.co\.nz\//i.test(t)) return false;
      if (/^https?:\/\/\S+$/i.test(t) && /homes\.co\.nz|trademe\.co\.nz|oneroof\.co\.nz/i.test(t)) {
        return false;
      }
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.length ? cleaned : null;
}

/**
 * Squarespace page HTML ships with layout chrome (spacers, social SVGs, aspect-ratio
 * image shells) that collapses badly without Squarespace CSS — often as multi-thousand
 * pixel gaps. Prefer the text blocks only; the listing gallery already covers photos.
 */
export function cleanMigratedBodyHtml(html: string | null | undefined): string | null {
  if (!html?.trim()) return null;
  // Always strip import footers, even on non-Squarespace HTML
  html = html
    .replace(/<p[^>]*>\s*Imported from[\s\S]*?<\/p>/gi, "")
    .replace(/Imported from\s+[\w.-]+(?:\.[a-z]{2,})?/gi, "")
    .replace(/https?:\/\/(?:www\.)?homes\.co\.nz\/address\/[^\s<"']+/gi, "");
  if (!/sqs-/i.test(html)) return html.trim() || null;

  const blocks: string[] = [];
  const re =
    /<div[^>]*class="[^"]*sqs-html-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const inner = tidyBlock(match[1] ?? "");
    if (inner) blocks.push(inner);
  }

  if (blocks.length === 0) {
    // Fallback: strip known junk blocks, keep the rest
    return tidyBlock(
      html
        .replace(
          /<div[^>]*class="[^"]*(?:spacer-block|social-account-links|sqs-block-social|horizontalrule|image-block)[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi,
          ""
        )
        .replace(/<style[\s\S]*?<\/style>/gi, "")
    );
  }

  return blocks.join("\n");
}

function tidyBlock(html: string): string {
  let s = html
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<ul>\s*<\/ul>/gi, "")
    .replace(/<ol>\s*<\/ol>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br/><br/>")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Drop blocks that are only whitespace / empty tags
  const text = s.replace(/<[^>]+>/g, "").trim();
  if (text.length < 2) return "";
  return s;
}
