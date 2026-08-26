export function toWaLink(phone: string, message?: string): string | null {
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return null;

  const normalized = digitsOnly.startsWith("0")
    ? `62${digitsOnly.slice(1)}`
    : digitsOnly.startsWith("62")
      ? digitsOnly
      : `62${digitsOnly}`;

  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${query}`;
}
