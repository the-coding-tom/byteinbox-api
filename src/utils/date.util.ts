// Date Utility Functions (Pure functions)

/**
 * Check if a date is in the past
 */
export function isExpired(date: Date | null | undefined): boolean {
  if (!date) return false;
  return new Date() > date;
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | null | undefined): boolean {
  if (!date) return false;
  return new Date() < date;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get the difference in minutes between two dates
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60));
}

/**
 * Get the difference in hours between two dates
 */
export function getHoursDifference(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60));
}

/**
 * Get the difference in days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format a date to ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse a date from ISO string
 */
export function fromISOString(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Check if a string is a valid date
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Get current date
 */
export function getCurrentDate(): Date {
  return new Date();
} 