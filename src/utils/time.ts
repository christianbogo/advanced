// src/utils/time.ts

/**
 * Converts a time string (MM:SS.hh or SS.hh) into total hundredths of a second.
 *
 * Handles formats like: "1:23.45", "58.76", "1:05", "32", "1:2.3" -> "1:02.30"
 * Returns null if the format is invalid or ambiguous.
 *
 * @param timeString The time string to convert.
 * @returns The total time in hundredths of a second, or null if invalid.
 */
export const timeStringToHundredths = (
  timeString: string | null | undefined
): number | null => {
  if (timeString === null || timeString === undefined) {
    return null;
  }

  let trimmedTime = String(timeString).trim();
  if (!trimmedTime) {
    return null;
  }

  let minutes = 0;
  let seconds = 0;
  let hundredths = 0;
  let timeParts: string[];

  // Check for minutes separator ':'
  if (trimmedTime.includes(':')) {
    timeParts = trimmedTime.split(':');
    if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) {
      // Invalid format like "1:", ":30", "1:2:3"
      return null;
    }

    const minutePart = parseInt(timeParts[0], 10);
    if (isNaN(minutePart) || minutePart < 0) {
      return null; // Invalid minutes
    }
    minutes = minutePart;
    // The second part now contains seconds and potentially hundredths
    trimmedTime = timeParts[1];
  } else {
    // No colon, assume the whole string is seconds.hundredths
    timeParts = [trimmedTime]; // Keep consistency for later checks
  }

  // Process seconds and hundredths from the remaining part (or the whole string if no colon)
  const secondsPartString = trimmedTime;
  if (secondsPartString.includes('.')) {
    const secParts = secondsPartString.split('.');
    if (secParts.length !== 2 || !secParts[0]) {
      // Invalid format like ".5", "30." with nothing after, "1.2.3"
      // Allow empty string before dot if minutes were present (e.g., "1:.5" - though odd) - handled by earlier split check
      return null;
    }

    const secIntPart = parseInt(secParts[0], 10);
    if (isNaN(secIntPart) || secIntPart < 0 || secIntPart >= 60) {
      // Seconds must be between 0 and 59
      return null;
    }
    seconds = secIntPart;

    // Handle hundredths - allow flexible input like "5" -> 50, "05" -> 5
    let hundredthsStr = secParts[1].padEnd(2, '0').substring(0, 2); // Pad with 0s, take first two digits
    const hundredthsPart = parseInt(hundredthsStr, 10);

    if (isNaN(hundredthsPart) || hundredthsPart < 0 || hundredthsPart > 99) {
      return null; // Invalid hundredths
    }
    hundredths = hundredthsPart;
  } else {
    // No decimal point, assume whole seconds
    const secIntPart = parseInt(secondsPartString, 10);
    if (isNaN(secIntPart) || secIntPart < 0 || secIntPart >= 60) {
      // Seconds must be between 0 and 59
      return null;
    }
    seconds = secIntPart;
    hundredths = 0; // Default to 0 hundredths
  }

  // Final calculation
  return minutes * 60 * 100 + seconds * 100 + hundredths;
};

/**
 * Converts a total time in hundredths of a second into a formatted string (M:SS.hh or SS.hh).
 *
 * @param totalHundredths The total time in hundredths, or null/undefined.
 * @returns Formatted time string (e.g., "1:23.45", "58.76"), or '--' if input is invalid.
 */
export const hundredthsToTimeString = (
  totalHundredths: number | null | undefined
): string => {
  if (
    totalHundredths === null ||
    totalHundredths === undefined ||
    isNaN(totalHundredths) ||
    totalHundredths < 0
  ) {
    return '--'; // Return placeholder for invalid or missing input
  }

  const totalSeconds = Math.floor(totalHundredths / 100);
  const hundredths = Math.floor(totalHundredths % 100); // Use floor just in case input wasn't integer
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = String(seconds).padStart(2, '0');
  const paddedHundredths = String(hundredths).padStart(2, '0');

  if (minutes > 0) {
    return `${minutes}:${paddedSeconds}.${paddedHundredths}`;
  } else {
    // Standard swimming format doesn't typically show 0 minutes (e.g., 5.12 not 0:05.12)
    // If you *want* the leading zero minute for times under 1 min, change this line:
    // return `0:${paddedSeconds}.${paddedHundredths}`;
    // Otherwise, use this standard format:
    return `${seconds}.${paddedHundredths}`;
  }
};
