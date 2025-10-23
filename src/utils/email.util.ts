/**
 * Extract email address from a string that may contain a display name
 * Supports formats: "email@domain.com" or "Name <email@domain.com>"
 * @param fromAddress - The from address string
 * @returns The extracted email address or null if invalid
 */
export function extractEmailAddress(fromAddress: string): string | null {
  if (!fromAddress) return null;

  // Check if format is "Name <email@domain.com>"
  const bracketMatch = fromAddress.match(/<([^>]+)>/);
  if (bracketMatch) {
    return bracketMatch[1].trim();
  }

  // Otherwise treat as plain email
  return fromAddress.trim();
}

/**
 * Extract domain from an email address string
 * Supports formats: "email@domain.com" or "Name <email@domain.com>"
 * @param fromAddress - The from address string
 * @returns The extracted domain or null if invalid
 */
export function extractDomainFromEmail(fromAddress: string): string | null {
  const email = extractEmailAddress(fromAddress);
  if (!email) return null;

  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}
