import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
}

  export function formatTimeSlot(start: string, durationMin: number) {
  const [h, m] = start.split(':').map(Number);
  const endTotalMin = h * 60 + m + durationMin;
  const endH = Math.floor(endTotalMin / 60).toString().padStart(2, '0');
  const endM = (endTotalMin % 60).toString().padStart(2, '0');
  return `${endH}:${endM}`;
}

export function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}
