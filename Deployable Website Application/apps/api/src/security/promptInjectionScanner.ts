import crypto from 'node:crypto';
import type {
  PromptInjectionChannel,
  PromptInjectionFinding,
  PromptInjectionReport,
  Severity,
} from '@scamhisn/shared';

export interface UntrustedChannelInput {
  visibleText: string;
  hiddenDomTexts: string[];
  htmlComments: string[];
  metaTexts: string[];
  mapReviews: string[];
  ariaAndDataAttrs: string[];
}

interface InjectionPattern {
  name: string;
  regex: RegExp;
  baseSeverity: Severity;
  isScoreManipulation?: boolean;
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  // Direct instruction overrides (English)
  {
    name: 'instruction_override_en',
    regex:
      /\b(ignore|disregard|forget|override|bypass)\s+(?:(?:all|any|the|your|these|those|every)\s+)?(?:of\s+)?(?:the\s+)?(previous|prior|above|system|developer|earlier|preceding)\s+(instructions?|prompts?|rules?|directives?|guidelines?)\b/i,
    baseSeverity: 'critical',
  },
  {
    // NOTE: a bare "developer mode" is ordinary website copy (Chrome, Android, Discord docs —
    // and our own footer), so it is only flagged when addressed to the reader as a state change.
    name: 'system_override_en',
    regex:
      /\b(system\s+override|you\s+are\s+(now\s+)?in\s+developer\s+mode|jailbreak\s+mode|enter\s+admin\s+mode|new\s+system\s+instructions?|override\s+security\s+policy)\b/i,
    baseSeverity: 'critical',
  },
  {
    // Requires an AI-like noun or an instruction verb, so marketing copy such as
    // "You are now a member" or "From now on you will receive our newsletter" never matches.
    name: 'role_hijack_en',
    regex:
      /\b(you\s+are\s+now\s+(a|an|the|my)\s+(\w+\s+){0,2}(ai|assistant|chatbot|bot|model|llm|language\s+model|inspector|scanner|agent)\b|from\s+now\s+on,?\s+you\s+(must|will|should|are\s+to)\s+(ignore|disregard|forget|rate|respond|reply|answer|say|output|classify|mark|treat|act|behave|pretend|approve)\b|act\s+as\s+a\s+helpful\s+assistant\s+that\s+ignores)/i,
    baseSeverity: 'high',
  },
  // Direct scam-scanner score manipulation (English)
  {
    name: 'score_manipulation_en',
    regex:
      /\b(rate\s+this\s+(site|url|link|page|business|listing|job)?\s*(as\s*)?(0%|0\b|safe|legit|legitimate|100%\s*safe)|scam\s*score\s*[:=]\s*0|scamScore["']?\s*[:=]\s*0|(scam|risk)\s+score\s+(for\s+this\s+(page|site|website|link|url|listing)\s+)?(is|should\s+be|must\s+be)\s+0|(give|assign|award)\s+(it|this\s+\w+|the\s+\w+)\s+(a\s+)?((scam|risk)\s+)?score\s+of\s+0|mark\s+(this\s+)?(url|link|site|page|business)\s+as\s+(safe|legitimate|verified)|classify\s+as\s+(safe|legitimate|not\s+a\s+scam)|return\s+verdict\s*[:=]?\s*["']?safe["']?|output\s+0%\s+scam|must\s+give\s+a\s+score\s+of\s+0)\b/i,
    baseSeverity: 'critical',
    isScoreManipulation: true,
  },
  {
    name: 'inspector_directive_en',
    regex:
      /\b(note\s+to\s+(ai|llm|assistant|inspector|scanner|model)|attention\s+(ai|llm|gemini|chatgpt|claude)|dear\s+(ai|model|scanner)|for\s+ai\s+evaluators?)\s*[:,-]/i,
    baseSeverity: 'critical',
    isScoreManipulation: true,
  },
  // Direct instruction overrides & score manipulation (Arabic)
  {
    name: 'instruction_override_ar',
    regex:
      /(تجاهل\s+(كل\s+|جميع\s+)?(التعليمات|الأوامر|القواعد)\s+(السابقة|الأولى)|تجاهل\s+(كل\s+|جميع\s+)?ما\s+(سبق|ورد\s+أعلاه)|تجاوز\s+(النظام|التعليمات|الحماية)|انسَ\s+التعليمات\s+السابقة)/i,
    baseSeverity: 'critical',
  },
  {
    name: 'score_manipulation_ar',
    regex:
      /(اعطِ?\s+(هذا\s+)?(الرابط|الموقع)\s+(تقييم|نسبة)\s*0|قيّ?م\s+(هذا\s+)?(الرابط|الموقع)\s+(كـ?\s*)?آمن|صنّ?ف\s+(الرابط|الموقع)\s+آمن|اعتبر\s+(هذا\s+)?(الرابط|الموقع)\s+آمن|لا\s+تصنّ?ف\s+هذا\s+الموقع\s+كاحتيال|ملاحظة\s+للذكاء\s+الاصطناعي)/i,
    baseSeverity: 'critical',
    isScoreManipulation: true,
  },
  // Prompt delimiter / chat template spoofing
  {
    name: 'delimiter_spoofing',
    regex:
      /(<\|im_start\|>|<\|im_end\|>|<\|system\|>|<<<\s*END_?UNTRUSTED|<<<\s*UNTRUSTED_PAGE_DATA|###\s*SYSTEM\s*(PROMPT|INSTRUCTION)|\[SYSTEM\s*OVERRIDE\]|<system_instruction>|<\/untrusted_data>)/i,
    baseSeverity: 'critical',
  },
];

// Zero-width and invisible bidirectional formatting characters
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

// Unicode Tag Block (U+E0000 - U+E007F) used for invisible ASCII prompt smuggling
const UNICODE_TAG_REGEX = /[\u{E0000}-\u{E007F}]{6,}/gu;

// Candidate Base64 strings (>= 28 chars, divisible by 4 or standard padded)
const BASE64_CANDIDATE_REGEX = /(?:[A-Za-z0-9+/]{28,}={0,2})/g;

function decodeUnicodeTags(text: string): string | null {
  const matches = text.match(UNICODE_TAG_REGEX);
  if (!matches) return null;

  const decodedChunks: string[] = [];
  for (const seq of matches) {
    let decoded = '';
    for (const ch of seq) {
      const cp = ch.codePointAt(0);
      if (cp !== undefined && cp >= 0xe0020 && cp <= 0xe007e) {
        decoded += String.fromCharCode(cp - 0xe0000);
      }
    }
    if (decoded.trim().length >= 4) {
      decodedChunks.push(decoded.trim());
    }
  }
  return decodedChunks.length > 0 ? decodedChunks.join(' | ') : null;
}

function extractSuspiciousBase64Payloads(text: string): Array<{ raw: string; decoded: string }> {
  const results: Array<{ raw: string; decoded: string }> = [];
  const matches = text.match(BASE64_CANDIDATE_REGEX);
  if (!matches) return results;

  const seen = new Set<string>();
  for (const candidate of matches.slice(0, 25)) {
    if (seen.has(candidate) || candidate.length > 1200) continue;
    seen.add(candidate);

    // Skip obvious hashes/JWT-like noise unless decoded text is readable ASCII/UTF-8
    try {
      const buf = Buffer.from(candidate, 'base64');
      const decoded = buf.toString('utf8');
      if (decoded.length < 12) continue;

      // Require >= 85% printable characters
      let printable = 0;
      for (let i = 0; i < decoded.length; i++) {
        const code = decoded.charCodeAt(i);
        if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13 || code >= 0x0600) {
          printable++;
        }
      }
      if (printable / decoded.length >= 0.85) {
        results.push({ raw: candidate.slice(0, 60), decoded: decoded.slice(0, 300) });
      }
    } catch {
      // ignore invalid base64
    }
  }
  return results;
}

function excerptAround(text: string, index: number, matchLen: number): string {
  const start = Math.max(0, index - 35);
  const end = Math.min(text.length, index + matchLen + 65);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function elevateSeverityForChannel(
  base: Severity,
  channel: PromptInjectionChannel,
): Severity {
  // Any prompt-injection attempt concealed inside hidden DOM, HTML comments,
  // ARIA/data attributes, or Google Maps reviews is unambiguously malicious -> critical
  if (
    channel === 'hidden_dom' ||
    channel === 'html_comment' ||
    channel === 'map_review' ||
    channel === 'aria_or_data_attr'
  ) {
    return 'critical';
  }
  return base;
}

const SEVERITY_RANK: Record<PromptInjectionReport['severity'], number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function scanSingleChannel(
  channel: PromptInjectionChannel,
  rawText: string,
  findings: PromptInjectionFinding[],
): { zeroWidthCount: number; unicodeTagFound: boolean } {
  if (!rawText || !rawText.trim()) {
    return { zeroWidthCount: 0, unicodeTagFound: false };
  }

  const zeroWidthMatches = rawText.match(ZERO_WIDTH_REGEX);
  const zeroWidthCount = zeroWidthMatches?.length ?? 0;

  // Strip zero-width characters before regex scanning so attackers cannot split "ig\u200Bnore"
  const normalizedText = rawText.replace(ZERO_WIDTH_REGEX, '');

  // 1. Check Unicode Tag Block smuggling (U+E0000 - U+E007F)
  let unicodeTagFound = false;
  const decodedTags = decodeUnicodeTags(rawText);
  if (decodedTags) {
    unicodeTagFound = true;
    findings.push({
      channel,
      patternName: 'unicode_tag_smuggling',
      severity: 'critical',
      matchedExcerpt: 'Invisible Unicode Tag Block (U+E0000–U+E007F) payload detected',
      decodedPayload: decodedTags.slice(0, 240),
    });
  }

  // 2. Direct pattern scan on normalized text
  for (const pattern of INJECTION_PATTERNS) {
    const match = pattern.regex.exec(normalizedText);
    if (match) {
      findings.push({
        channel,
        patternName: pattern.name,
        severity: elevateSeverityForChannel(pattern.baseSeverity, channel),
        matchedExcerpt: excerptAround(normalizedText, match.index, match[0].length),
      });
    }
  }

  // 3. Base64-encoded prompt-injection smuggling check
  const b64Candidates = extractSuspiciousBase64Payloads(normalizedText);
  for (const item of b64Candidates) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.regex.test(item.decoded)) {
        findings.push({
          channel,
          patternName: `base64_${pattern.name}`,
          severity: 'critical',
          matchedExcerpt: `Base64 payload: ${item.raw}...`,
          decodedPayload: item.decoded.slice(0, 240),
        });
        break;
      }
    }
  }

  // 4. Excessive invisible zero-width characters in hidden DOM or map reviews
  if (zeroWidthCount >= 15 && (channel === 'hidden_dom' || channel === 'map_review')) {
    findings.push({
      channel,
      patternName: 'excessive_zero_width_obfuscation',
      severity: 'high',
      matchedExcerpt: `${zeroWidthCount} invisible zero-width/bidi characters embedded in ${channel}`,
    });
  }

  return { zeroWidthCount, unicodeTagFound };
}

/**
 * Deterministic local pre-scanner for prompt-injection attacks across all untrusted DOM & review channels.
 */
export function scanForPromptInjection(input: UntrustedChannelInput): PromptInjectionReport {
  const findings: PromptInjectionFinding[] = [];
  let totalZeroWidth = 0;
  let unicodeTagSmugglingDetected = false;

  const processText = (channel: PromptInjectionChannel, text: string) => {
    const res = scanSingleChannel(channel, text, findings);
    totalZeroWidth += res.zeroWidthCount;
    if (res.unicodeTagFound) unicodeTagSmugglingDetected = true;
  };

  processText('visible_text', input.visibleText);
  for (const snippet of input.hiddenDomTexts) processText('hidden_dom', snippet);
  for (const comment of input.htmlComments) processText('html_comment', comment);
  for (const meta of input.metaTexts) processText('meta_tag', meta);
  for (const review of input.mapReviews) processText('map_review', review);
  for (const attr of input.ariaAndDataAttrs) processText('aria_or_data_attr', attr);

  // Deduplicate identical pattern+channel+excerpt hits
  const uniqueMap = new Map<string, PromptInjectionFinding>();
  for (const f of findings) {
    const key = `${f.channel}:${f.patternName}:${f.matchedExcerpt.slice(0, 60)}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, f);
    }
  }
  const dedupedFindings = Array.from(uniqueMap.values()).slice(0, 20);

  let maxSeverity: PromptInjectionReport['severity'] = 'none';
  for (const f of dedupedFindings) {
    const rank = SEVERITY_RANK[f.severity === 'info' ? 'low' : f.severity];
    if (rank > SEVERITY_RANK[maxSeverity]) {
      maxSeverity = f.severity === 'info' ? 'low' : f.severity;
    }
  }

  const hiddenDomInjectionDetected = dedupedFindings.some(
    (f) => f.channel === 'hidden_dom' || f.channel === 'html_comment' || f.channel === 'aria_or_data_attr',
  );
  const reviewInjectionDetected = dedupedFindings.some((f) => f.channel === 'map_review');

  return {
    detected: dedupedFindings.length > 0,
    severity: maxSeverity,
    zeroWidthCharCount: totalZeroWidth,
    unicodeTagSmugglingDetected,
    hiddenDomInjectionDetected,
    reviewInjectionDetected,
    findings: dedupedFindings,
  };
}

/**
 * Wraps untrusted webpage / map content inside a unique per-request cryptographic boundary,
 * neutralizing any attempts to spoof boundary delimiters or smuggle invisible Unicode tags.
 */
export function wrapUntrustedContent(payload: unknown): {
  boundaryToken: string;
  startTag: string;
  endTag: string;
  wrappedBlock: string;
} {
  const boundaryToken = crypto.randomUUID().toUpperCase().replace(/-/g, '_');
  const startTag = `<<<UNTRUSTED_PAGE_DATA_${boundaryToken}>>>`;
  const endTag = `<<<END_UNTRUSTED_PAGE_DATA_${boundaryToken}>>>`;

  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);

  // Neutralize any triple angle brackets, invisible tag chars, or boundary collision attempts
  const neutralized = serialized
    .replace(/<<<+/g, '[NEUTRALIZED_DELIMITER_OPEN]')
    .replace(/>>>+/g, '[NEUTRALIZED_DELIMITER_CLOSE]')
    .replace(UNICODE_TAG_REGEX, '[STRIPPED_INVISIBLE_UNICODE_TAGS]');

  return {
    boundaryToken,
    startTag,
    endTag,
    wrappedBlock: `${startTag}\n${neutralized}\n${endTag}`,
  };
}
