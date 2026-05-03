import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge condicional de classes Tailwind, com dedupe.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pequeno helper pra criar IDs estáveis em SSR.
 */
let counter = 0;
export function ssrSafeId(prefix = "id") {
  counter += 1;
  return `${prefix}-${counter}`;
}

export const noop = () => undefined;

/**
 * Quando Supabase retorna `relation:table(...)`, dependendo da inferência o tipo
 * pode ser objeto OU array. Em runtime, FK 1-1 vem como objeto. Esse helper
 * normaliza pra objeto sempre.
 */
export function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
