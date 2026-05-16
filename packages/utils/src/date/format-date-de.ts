export function formatDateDE(value: string | Date): string {
  return new Intl.DateTimeFormat("de-DE").format(new Date(value))
}
