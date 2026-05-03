// ════════════════════════════════════════════════════════════════════
// Utility functions compartilhadas entre apps
// ════════════════════════════════════════════════════════════════════

// ─── Formatters ──────────────────────────────────────────────────────
export const formatBRL = (
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string => {
  const max = options?.maximumFractionDigits ?? 2;
  // garante que min nunca seja maior que max (Intl reclama)
  const min = Math.min(options?.minimumFractionDigits ?? 2, max);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(value || 0);
};

export const formatNumber = (value: number, fractionDigits = 0): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value || 0);
};

export const formatPercent = (
  value: number,
  options?: { decimals?: number; alreadyPercent?: boolean },
): string => {
  const num = options?.alreadyPercent ? value : value * 100;
  return `${num.toFixed(options?.decimals ?? 2)}%`;
};

export const formatCompact = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
};

export const formatDate = (date: string | Date, format: "short" | "long" | "datetime" = "short") => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  switch (format) {
    case "short":
      return d.toLocaleDateString("pt-BR");
    case "long":
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    case "datetime":
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  }
};

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? "es" : ""}`;
  const years = Math.floor(days / 365);
  return `há ${years} ano${years > 1 ? "s" : ""}`;
};

// ─── Slugify ─────────────────────────────────────────────────────────
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

// ─── Math helpers ────────────────────────────────────────────────────
export const safeDiv = (numerator: number, denominator: number, fallback = 0): number => {
  if (!denominator) return fallback;
  return numerator / denominator;
};

export const computeCTR = (clicks: number, impressions: number) =>
  safeDiv(clicks, impressions) * 100;

export const computeCPC = (spend: number, clicks: number) => safeDiv(spend, clicks);
export const computeCPM = (spend: number, impressions: number) =>
  safeDiv(spend, impressions) * 1000;
export const computeCPA = (spend: number, conversions: number) => safeDiv(spend, conversions);
export const computeROAS = (conversionValue: number, spend: number) =>
  safeDiv(conversionValue, spend);

// ─── Date helpers ────────────────────────────────────────────────────
export const getPeriodRange = (
  preset:
    | "today"
    | "yesterday"
    | "last_7_days"
    | "last_14_days"
    | "last_30_days"
    | "this_month"
    | "last_month"
    | "this_quarter"
    | "last_quarter"
    | "ytd",
): { start: Date; end: Date } => {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };
  const subtractDays = (d: Date, days: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() - days);
    return x;
  };

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const y = subtractDays(now, 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "last_7_days":
      return { start: startOfDay(subtractDays(now, 6)), end: endOfDay(now) };
    case "last_14_days":
      return { start: startOfDay(subtractDays(now, 13)), end: endOfDay(now) };
    case "last_30_days":
      return { start: startOfDay(subtractDays(now, 29)), end: endOfDay(now) };
    case "this_month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(first), end: endOfDay(now) };
    }
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(first), end: endOfDay(last) };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const first = new Date(now.getFullYear(), q * 3, 1);
      return { start: startOfDay(first), end: endOfDay(now) };
    }
    case "last_quarter": {
      const q = Math.floor(now.getMonth() / 3) - 1;
      const year = q < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = q < 0 ? 9 : q * 3;
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 3, 0);
      return { start: startOfDay(first), end: endOfDay(last) };
    }
    case "ytd": {
      const first = new Date(now.getFullYear(), 0, 1);
      return { start: startOfDay(first), end: endOfDay(now) };
    }
  }
};

// ─── Comparator ──────────────────────────────────────────────────────
export const computeDelta = (current: number, previous: number) => {
  if (!previous && !current) return { value: 0, pct: 0 };
  if (!previous) return { value: current, pct: 100 };
  const pct = ((current - previous) / previous) * 100;
  return { value: current - previous, pct };
};

// ─── Type guards ─────────────────────────────────────────────────────
export const isNonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
};

// ─── Random / IDs ────────────────────────────────────────────────────
export const generateRandomToken = (length = 32) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ─── Sleep ───────────────────────────────────────────────────────────
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Retry ───────────────────────────────────────────────────────────
export async function retry<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; delayMs?: number; backoff?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 500;
  const backoff = options.backoff ?? 2;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) {
        await sleep(delayMs * backoff ** i);
      }
    }
  }
  throw lastError;
}
