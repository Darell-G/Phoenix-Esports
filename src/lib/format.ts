export function date(value?: string | null, withTime = false) {
  if (!value) return "To be announced";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
export const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
export const human = (value: string) => value.replace(/_/g, " ");
export const titleCase = (value: string) =>
  human(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
export const studentEmail = (value: string) =>
  /^[^\s@]+@student\.fatima\.edu\.ph$/i.test(value.trim());
export const errorMessage = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "Something went wrong. Please try again.";
export const toLocal = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .format(new Date(value))
        .replace(" ", "T")
    : "";
export const fromLocal = (value: string) =>
  value ? new Date(`${value}:00+08:00`).toISOString() : null;
export function safeLink(value: string | null | undefined) {
  try {
    const url = new URL(value || "");
    return ["https:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
