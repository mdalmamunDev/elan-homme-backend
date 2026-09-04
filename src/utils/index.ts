export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const toInt = (val: unknown, fallback: number): number => {
  if (val == null) return fallback;
  const parsed = parseInt(val as string, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const toOptionalInt = (val: unknown): number | undefined => {
  if (val == null) return undefined;
  const parsed = parseInt(val as string, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const toSortOrder = (val: unknown): 'asc' | 'desc' =>
  val === 'asc' ? 'asc' : 'desc';

export const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'amount',
  'charge',
  'status',
]);

// ─── Parse "YYYY-MM" into a Date at the 1st of that month (UTC) ─────────────

export const parseYearMonth = (val: unknown): Date | null => {
  if (typeof val !== 'string' || !val.trim()) return null;

  const match = val.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10); // 1-12

  if (month < 1 || month > 12) return null;

  // UTC: first day of the given month
  return new Date(Date.UTC(year, month - 1, 1));
};
