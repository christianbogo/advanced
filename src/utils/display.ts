// Assuming this code is in a file like src/utils/display.ts or similar

// Define the Person type locally if not imported (as provided in the prompt context)
interface Person {
  birthday: string | null | undefined;
  gender?: 'M' | 'F' | 'O' | null;
}

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

/**
 * Calculates the current age based on a birthday string.
 * (No changes needed to this function based on the request - it already handles null/undefined input)
 * @param birthdayString - The birthday in 'YYYY-MM-DD' format.
 * @returns The calculated age as a number, or null if input is invalid/missing.
 */
export function calculateAge(
  birthdayString: string | null | undefined
): number | null {
  if (!birthdayString) {
    return null; // No birthday provided
  }
  try {
    // Add time component to prevent timezone interpretation issues affecting the date part
    const birthDate = new Date(birthdayString + 'T00:00:00');
    // Check if the parsed date is valid
    if (isNaN(birthDate.getTime())) {
      console.warn(
        `[calculateAge] Invalid birthday format encountered: ${birthdayString}`
      );
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      // Birthday hasn't occurred yet this year
      age--;
    }

    return age >= 0 ? age : null; // Return null if age calculation is negative (e.g., future date)
  } catch (e) {
    console.error(
      `[calculateAge] Error parsing birthday string "${birthdayString}":`,
      e
    );
    return null;
  }
}

/**
 * Generates the age/gender suffix string (e.g., "23M", "14F", "43", "O").
 * (No changes needed to this function based on the request)
 * @param person - The Person object.
 * @returns The formatted string, or an empty string if no age or gender is available.
 */
export const getAgeGenderString = (person: Person): string => {
  const age = calculateAge(person.birthday);
  const gender = person.gender; // 'M', 'F', 'O', or null/undefined

  let parts: string[] = [];
  // Add age part if valid number
  if (age !== null) {
    parts.push(String(age));
  }
  // Add gender part if it exists
  if (gender) {
    parts.push(gender);
  }

  // Join directly without separator: "23" + "M" -> "23M", "23" -> "23", "F" -> "F"
  return parts.join('');
};
