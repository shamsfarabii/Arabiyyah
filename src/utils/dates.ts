export function toIsoNow(): string {
  return new Date().toISOString();
}

export function addDays(fromIso: string, days: number): string {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function isReviewDue(nextReviewAt: string): boolean {
  return new Date(nextReviewAt).getTime() <= Date.now();
}
