import { parse as parseDomain } from 'tldts';

/**
 * People paste the whole SMS / WhatsApp message, not just the link. This pulls the first real
 * link out of free text so the scan can proceed instead of failing on "invalid whitespace".
 *
 * Returns the input unchanged (trimmed) when it is already a single token, the first link found
 * when the input is a sentence, or null when the text contains no link at all.
 */

const URL_CANDIDATE =
  /(?<![@\w.-])(?:https?:\/\/[^\s<>"'`]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{2,5})?(?:\/[^\s<>"'`]*)?)/giu;

// Sentence punctuation (Latin and Arabic) that clings to the end of a pasted link
const TRAILING_PUNCTUATION = /[.,;:!?)\]}>'"`،؛؟»]+$/u;

function isRealPublicHost(candidate: string): boolean {
  const withScheme = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const host = new URL(withScheme).hostname;
    const parsed = parseDomain(host);
    // Requires a genuine ICANN public suffix, so "12.50", "e.g" or "Mr.Smith" are not links
    return Boolean(parsed.domain && parsed.isIcann);
  } catch {
    return false;
  }
}

export function extractFirstUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Already a single token: leave validation to the URL guard
  if (!/\s/.test(trimmed)) return trimmed;

  for (const match of trimmed.matchAll(URL_CANDIDATE)) {
    const candidate = match[0].replace(TRAILING_PUNCTUATION, '');
    if (candidate && isRealPublicHost(candidate)) {
      return candidate;
    }
  }
  return null;
}
