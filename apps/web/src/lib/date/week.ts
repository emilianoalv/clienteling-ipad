const DAY_MS = 86_400_000;

/** Returns a new Date set to 00:00:00.000 of the same day. */
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** True iff a and b fall on the same calendar day in local time. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

/** Monday-based start of week. */
export function startOfIsoWeek(d: Date): Date {
  const x = startOfDay(d);
  const dayOfWeek = (x.getDay() + 6) % 7;
  return addDays(x, -dayOfWeek);
}

/** First day of the calendar month (day = 1). */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of the calendar month. */
export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * ISO 8601 week number (1..53). Reference algorithm from ISO 8601, matches
 * the prototype's `_isoWeek` helper in `app/screens-ops.jsx`.
 */
export function isoWeekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
}

/** Inclusive difference in whole days between two dates (local). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}
