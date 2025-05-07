interface Person {
  birthday: string | null | undefined;
  gender?: 'M' | 'F' | 'O' | null;
}

/**
 * Calculates the current age based on a birthday string.
 * @param birthdayString - The birthday in 'YYYY-MM-DD' format.
 * @returns The calculated age as a number, or null if input is invalid or missing.
 */
export function calculateAge(
  birthdayString: string | null | undefined
): number | null {
  if (!birthdayString) {
    return null;
  }

  try {
    const birthDate = new Date(birthdayString + 'T00:00:00');

    if (isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch (e) {
    return null;
  }
}

/**
 * Generates an age and/or gender suffix string.
 * Examples: "23M", "14F", "43", "O".
 * @param person - The person object containing birthday and gender.
 * @returns The formatted string, or an empty string if no age or gender is available.
 */
export const getAgeGenderString = (person: Person): string => {
  const age = calculateAge(person.birthday);
  const gender = person.gender;

  const parts: string[] = [];

  if (age !== null) {
    parts.push(String(age));
  }
  if (gender) {
    parts.push(gender);
  }

  return parts.join('');
};
