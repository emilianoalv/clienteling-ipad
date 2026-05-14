import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Conditional class joiner used by every component.
 * Combines clsx (conditional classes) with tailwind-merge so consumer-
 * provided classes win over component defaults without duplicates.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(...values));
}
