export function isValidPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      url.hash
    ) {
      return false;
    }

    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    return true;
  } catch {
    return false;
  }
}
