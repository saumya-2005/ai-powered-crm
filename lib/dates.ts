import { format, parseISO } from "date-fns";

// Today as YYYY-MM-DD in the user's local time
export function todayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}

// Example: 20 Nov 2026
export function formatDate(value: string): string {
  return format(parseISO(value), "dd MMM yyyy");
}

// Example: 20 Nov 2026, 4:30 PM
export function formatDateTime(value: string): string {
  return format(new Date(value), "dd MMM yyyy, h:mm a");
}
