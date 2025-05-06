// Assuming this code is in a file like src/utils/display.ts or similar

/**
 * Displays a date string in M/D/YY format. Handles invalid or missing input.
 * @param date - The date string in 'YYYY-MM-DD' format, or null/undefined.
 * @returns The formatted date string (e.g., "5/4/25"), or null if input is invalid.
 */
export function dateDisplay(date: string | null | undefined): string | null {
  // 1. Validate the input type and presence
  if (!date || typeof date !== 'string' || date.length === 0) {
    return null; // Return null if date is null, undefined, not a string, or empty
  }

  try {
    // 2. Validate the format (basic check for YYYY-MM-DD structure via split)
    const parts = date.split('-');
    if (parts.length !== 3) {
      console.warn(
        `[dateDisplay] Input date "${date}" is not in YYYY-MM-DD format.`
      );
      return null; // Incorrect format
    }

    // 3. Parse the parts (ensure they are numbers)
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // Month part (1-12)
    const day = parseInt(parts[2], 10); // Day part (1-31)

    // 4. Validate parsed parts (basic sanity check)
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      console.warn(
        `[dateDisplay] Invalid date components parsed from "${date}".`
      );
      return null; // Invalid date components
    }

    // 5. Format the output string M/D/YY
    // Use String() conversion for safety, though already checked isNaN
    // Use slice(-2) to get the last two digits of the year.
    const formattedDate = `${String(month)}/${String(day)}/${String(year).slice(-2)}`;
    return formattedDate;
  } catch (error) {
    // Catch any unexpected errors during processing
    console.error(
      `[dateDisplay] Error processing date string "${date}":`,
      error
    );
    return null; // Return null on error
  }
}
