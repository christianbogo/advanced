import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  documentId,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Athlete, Person, Team, Season } from '../../models/index'; // Adjust path as needed
// Assuming fetchChunkedData is extracted or available
import { fetchChunkedData } from '../../utils/firestore'; // Adjust path as needed

// Re-use or redefine AthleteWithContextInfo if needed, ensure 'person' (personId) is accessible
// Assuming Athlete model has 'person: string'
export interface AthleteWithContextInfo extends Athlete {
  personFirstName?: string;
  personLastName?: string;
  personPreferredName?: string;
  personBirthday?: string | null;
  personGender?: 'M' | 'F' | 'O' | null;
  // We don't necessarily need team/season context *within* the modal's data
  // if we are already filtering by team/season, but keep if useful for display.
  teamCode?: string;
  seasonName?: string;
  seasonYear?: string;
}

const FIRESTORE_IN_QUERY_LIMIT = 30; // Define if not globally available

/**
 * Fetches athletes specifically for a given team and season.
 * Includes basic person context information.
 *
 * @param teamId The ID of the team.
 * @param seasonId The ID of the season.
 * @returns Promise resolving to AthleteWithContextInfo[]
 */
const fetchAthletesForSeason = async (
  teamId: string | null,
  seasonId: string | null
): Promise<AthleteWithContextInfo[]> => {
  // If team or season is not provided, return empty array immediately
  if (!teamId || !seasonId) {
    console.log(
      '[fetchAthletesForSeason] TeamId or SeasonId missing, skipping fetch.'
    );
    return [];
  }

  console.log(
    `[fetchAthletesForSeason] Fetching athletes for Team: ${teamId}, Season: ${seasonId}`
  );

  const athletesCollectionRef = collection(db, 'athletes');
  const athletesQueryConstraints: QueryConstraint[] = [
    where('team', '==', teamId),
    where('season', '==', seasonId),
    // Add default sorting if desired, e.g., by person's last name
    // This requires fetching person data first or having denormalized names
    // Let's sort client-side after fetching for simplicity for now.
    // orderBy('createdAt', 'desc') // Or sort by creation time
  ];

  let athletes: Athlete[] = [];
  try {
    const athletesQuery = query(
      athletesCollectionRef,
      ...athletesQueryConstraints
    );
    const athletesSnapshot = await getDocs(athletesQuery);
    athletes = athletesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Athlete, 'id'>),
    }));
    console.log(`[fetchAthletesForSeason] Found ${athletes.length} athletes.`);
  } catch (error) {
    console.error('[fetchAthletesForSeason] Error fetching athletes:', error);
    throw error; // Propagate error to React Query
  }

  if (athletes.length === 0) {
    return [];
  }

  // --- Fetch Related Person Data ---
  const personIds = Array.from(
    new Set(athletes.map((a) => a.person).filter(Boolean))
  );

  const personInfoMap = await fetchChunkedData<Person>(personIds, 'people');
  console.log(
    `[fetchAthletesForSeason] Fetched info for ${personInfoMap.size} people.`
  );

  // --- Combine Athlete data with Person context ---
  let athletesWithContext: AthleteWithContextInfo[] = athletes.map(
    (athlete) => {
      const personInfo = personInfoMap.get(athlete.person);
      return {
        ...athlete,
        // Ensure personId is directly accessible if Athlete interface uses 'person'
        // personId: athlete.person, // Uncomment if needed
        personFirstName: personInfo?.firstName ?? 'N/A',
        personLastName: personInfo?.lastName ?? 'N/A',
        personPreferredName: personInfo?.preferredName,
        personBirthday: personInfo?.birthday,
        personGender: personInfo?.gender,
        // Add team/season context if needed, though less critical here
      };
    }
  );

  // --- Client-Side Sorting (Example: by last name, then first name) ---
  athletesWithContext.sort((a, b) => {
    const lastNameCompare = (a.personLastName ?? '').localeCompare(
      b.personLastName ?? ''
    );
    if (lastNameCompare !== 0) return lastNameCompare;
    return (a.personFirstName ?? '').localeCompare(b.personFirstName ?? '');
  });

  console.log(
    '[fetchAthletesForSeason] Returning combined & sorted athlete data:',
    athletesWithContext.length
  );
  return athletesWithContext;
};

/**
 * Custom hook to fetch athletes for a specific team and season using React Query.
 * The query is disabled if teamId or seasonId is not provided.
 *
 * @param teamId The ID of the team.
 * @param seasonId The ID of the season.
 */
export function useAthletesForSeason(
  teamId: string | null,
  seasonId: string | null
) {
  // Query is enabled only if both teamId and seasonId are present
  const queryEnabled = !!teamId && !!seasonId;

  return useQuery<AthleteWithContextInfo[], Error>({
    // Query key includes team and season IDs for caching and refetching
    queryKey: ['athletesForSeason', teamId, seasonId],
    queryFn: () => fetchAthletesForSeason(teamId, seasonId),
    enabled: queryEnabled, // Dynamically enable/disable based on inputs
    // staleTime: 5 * 60 * 1000, // Optional: Cache data for 5 minutes
  });
}
