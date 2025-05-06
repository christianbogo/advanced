/**
 * Calculates the current age based on a birthday string.
 * (No changes needed to this function based on the request - it already handles null/undefined input)
 * @param birthdayString - The birthday in 'YYYY-MM-DD' format.
 * @returns The calculated age as a number, or null if input is invalid/missing.
 */

// Define the Person type locally if not imported (as provided in the prompt context)
interface Person {
  birthday: string | null | undefined;
  gender?: 'M' | 'F' | 'O' | null;
}

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
