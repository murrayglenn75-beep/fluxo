/** Deterministic, untrusted document-extraction boundary.
 * OCR/image reading happens in a separately authorized adapter. This module
 * never moves funds, persists documents, calls a model, or creates payments.
 */
export type LayoutBlock = Readonly<{ page: number; text: string; kind: 'line' | 'table' }>;
export type ExtractionCandidate = Readonly<{
  status: 'unverified';
  source: 'ocr';
  amountMinor: number | null;
  currency: 'BRL' | null;
  documentDate: string | null;
  evidence: readonly string[];
  warnings: readonly string[];
}>;

const MAX_BLOCKS = 500;
const MAX_TEXT = 5000;
const MONEY = /(?:R\$\s*)(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})(?!\d)/g;
function amountFromBRL(s: string): number | null {
  const matches = [...s.matchAll(MONEY)];
  if (matches.length !== 1) return null;
  const integer = Number(matches[0][1].replace(/\./g, ''));
  const cents = Number(matches[0][2]);
  const value = integer * 100 + cents;
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
function dateFromText(s: string): string | null {
  const m = s.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 2100 || d.getUTCFullYear() !== year ||
      d.getUTCMonth() + 1 !== month || d.getUTCDate() !== day) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function extractUnverifiedReceipt(blocks: readonly LayoutBlock[]): ExtractionCandidate {
  if (!Array.isArray(blocks) || blocks.length > MAX_BLOCKS) throw new Error('invalid_ocr_layout');
  const evidence: string[] = [];
  const warnings: string[] = [];
  for (const block of blocks) {
    if (!block || !Number.isSafeInteger(block.page) || block.page < 1 ||
        (block.kind !== 'line' && block.kind !== 'table') ||
        typeof block.text !== 'string' || block.text.length > MAX_TEXT ||
        /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(block.text)) {
      throw new Error('invalid_ocr_block');
    }
    const normalized = block.text.normalize('NFKC').trim();
    if (normalized) evidence.push(`page ${block.page}: ${normalized}`);
  }
  const amountLines = evidence.filter(line => /R\$\s*\d/.test(line));
  const uniqueAmounts = new Set(amountLines.flatMap(line => [...line.matchAll(MONEY)].map(m => m[0])));
  const amountMinor = uniqueAmounts.size === 1 ? amountFromBRL([...uniqueAmounts][0]) : null;
  if (amountMinor === null) warnings.push('ambiguous_or_missing_amount');
  const dates = new Set(evidence.map(dateFromText).filter((v): v is string => v !== null));
  const documentDate = dates.size === 1 ? [...dates][0] : null;
  if (documentDate === null) warnings.push('ambiguous_or_missing_date');
  warnings.push('manual_review_required');
  return Object.freeze({
    status: 'unverified' as const, source: 'ocr' as const,
    amountMinor, currency: amountMinor === null ? null : 'BRL' as const,
    documentDate, evidence: Object.freeze([...evidence]), warnings: Object.freeze(warnings)
  });
}
