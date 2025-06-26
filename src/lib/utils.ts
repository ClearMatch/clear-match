import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  isoDate?: string | null,
  formatStr: string = "MMM dd, yyyy"
): string {
  if (!isoDate) return "N/A";
  try {
    return format(parseISO(isoDate), formatStr);
  } catch {
    return "Invalid Date";
  }
}
