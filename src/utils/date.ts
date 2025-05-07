/**
 * Displays a date string in M/D/YY format. Handles invalid or missing input.
 * @param dateString - The date string in 'YYYY-MM-DD' format, or null/undefined.
 * @returns The formatted date string (e.g., "5/4/25"), or null if input is invalid.
 */
export function dateDisplay(
  dateString: string | null | undefined
): string | null {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const yearPart = parseInt(parts[0], 10);
  const monthPart = parseInt(parts[1], 10); // Month is 1-indexed in input 'YYYY-MM-DD'
  const dayPart = parseInt(parts[2], 10);

  if (
    isNaN(yearPart) ||
    isNaN(monthPart) ||
    isNaN(dayPart) ||
    monthPart < 1 ||
    monthPart > 12 ||
    dayPart < 1 ||
    dayPart > 31 // Basic day validation; doesn't check month-specific day counts (e.g., Feb 30)
  ) {
    return null;
  }

  // Get the last two digits of the year.
  const yearSuffix = String(yearPart).slice(-2);

  return `${monthPart}/${dayPart}/${yearSuffix}`;
}
