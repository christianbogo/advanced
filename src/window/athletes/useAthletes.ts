// src/window/athletes/useAthletes.ts
// Finalized code based on confirmations:

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
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path as needed

const FIRESTORE_IN_QUERY_LIMIT = 30;

// Define the structure for combined Athlete context information
export interface AthleteWithContextInfo extends Athlete {
  personFirstName?: string;
  personLastName?: string;
  personPreferredName?: string;
  personBirthday?: string | null; // <<< ADDED
  personGender?: 'M' | 'F' | 'O' | null; // <<< ADDED
  teamCode?: string;
  seasonName?: string;
  seasonYear?: string;
}

/**
 * Fetches athletes based on super-selected seasons or teams, and joins related Person, Team, Season info.
 * REQUIRES either super-selected seasons or teams to run the query.
 * @param superSelectedSeasonIds Array of IDs for super-selected seasons.
 * @param superSelectedTeamIds Array of IDs for super-selected teams.
 * @returns Promise<AthleteWithContextInfo[]> - A promise resolving to an array of athletes with context info.
 */
const fetchAthletesWithContext = async (
  superSelectedSeasonIds: string[],
  superSelectedTeamIds: string[]
): Promise<AthleteWithContextInfo[]> => {
  console.log(
    '[fetchAthletesWithContext] Running with superSelected Seasons:',
    superSelectedSeasonIds,
    'and Teams:',
    superSelectedTeamIds
  );

  const athletesCollectionRef = collection(db, 'athletes');
  // Default sort: Confirmed 'createdAt' desc works. Ensure 'createdAt' is indexed.
  const athletesQueryConstraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
  ];

  let filterApplied = false;
  let queryIsPossible = true; // Flag to check if the query filter is valid

  // --- 1. Determine Query Filter based on Super Selections ---
  if (superSelectedSeasonIds.length > 0) {
    filterApplied = true;
    console.log(
      '[fetchAthletesWithContext] Filtering query by super-selected seasons:',
      superSelectedSeasonIds
    );
    if (superSelectedSeasonIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
      athletesQueryConstraints.unshift(
        where('season', 'in', superSelectedSeasonIds)
      );
    } else {
      console.warn(
        `[fetchAthletesWithContext] Cannot filter by more than ${FIRESTORE_IN_QUERY_LIMIT} super-selected seasons. Disabling fetch.`
      );
      queryIsPossible = false; // Exceeds limit
    }
  } else if (superSelectedTeamIds.length > 0) {
    filterApplied = true;
    console.log(
      '[fetchAthletesWithContext] Filtering query by super-selected teams (no seasons super-selected):',
      superSelectedTeamIds
    );
    if (superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
      athletesQueryConstraints.unshift(
        where('team', 'in', superSelectedTeamIds)
      );
    } else {
      console.warn(
        `[fetchAthletesWithContext] Cannot filter by more than ${FIRESTORE_IN_QUERY_LIMIT} super-selected teams. Disabling fetch.`
      );
      queryIsPossible = false; // Exceeds limit
    }
  } else {
    // No relevant super-selection applied, and required filter is confirmed acceptable.
    console.log(
      '[fetchAthletesWithContext] No super-selected season or team provided. Fetch is disabled by design.'
    );
    queryIsPossible = false; // No filter applied
  }

  // If the query is not possible return empty array immediately.
  if (!queryIsPossible) {
    return [];
  }

  // --- 2. Execute Athlete Query ---
  const athletesQuery = query(
    athletesCollectionRef,
    ...athletesQueryConstraints
  );
  let athletes: Athlete[] = [];
  try {
    const athletesSnapshot = await getDocs(athletesQuery);
    athletes = athletesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Athlete, 'id'>),
    }));
    console.log(
      `[fetchAthletesWithContext] Found ${athletes.length} athletes matching filters.`
    );
  } catch (error) {
    console.error('[fetchAthletesWithContext] Error fetching athletes:', error);
    throw error; // Propagate error to React Query
  }

  if (athletes.length === 0) {
    return []; // No athletes found for the given filters
  }

  // --- 3. Fetch Related Context Data (People, Teams, Seasons) ---
  const personIds = Array.from(
    new Set(athletes.map((a) => a.person).filter(Boolean))
  );
  const teamIds = Array.from(
    new Set(athletes.map((a) => a.team).filter(Boolean))
  );
  const seasonIds = Array.from(
    new Set(athletes.map((a) => a.season).filter(Boolean))
  );

  // Helper function for fetching data in chunks (can be moved to a utils file)
  const fetchChunkedData = async <T extends { id?: string }>(
    ids: string[],
    collectionName: string,
    fields?: (keyof T)[] // Optional: specify fields to retrieve
  ): Promise<Map<string, Partial<T>>> => {
    const map = new Map<string, Partial<T>>();
    for (let i = 0; i < ids.length; i += FIRESTORE_IN_QUERY_LIMIT) {
      const chunkIds = ids.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
      if (chunkIds.length === 0) continue;
      const chunkQuery = query(
        collection(db, collectionName),
        where(documentId(), 'in', chunkIds)
      );
      try {
        const snapshot = await getDocs(chunkQuery);
        snapshot.docs.forEach((doc) => {
          map.set(doc.id, doc.data() as T); // Store the whole data object
        });
      } catch (error) {
        console.error(
          `[fetchChunkedData] Error fetching ${collectionName} chunk:`,
          chunkIds,
          error
        );
      }
    }
    console.log(
      `[fetchAthletesWithContext] Fetched info for ${map.size} ${collectionName}.`
    );
    return map;
  };

  // Fetch related data concurrently
  const [personInfoMap, teamInfoMap, seasonInfoMap] = await Promise.all([
    fetchChunkedData<Person>(personIds, 'people', [
      'firstName',
      'lastName',
      'preferredName',
    ]),
    fetchChunkedData<Team>(teamIds, 'teams', ['code']),
    fetchChunkedData<Season>(seasonIds, 'seasons', ['season', 'year']),
  ]);

  // --- 4. Combine Athlete data with fetched context ---
  const athletesWithContext: AthleteWithContextInfo[] = athletes.map(
    (athlete) => {
      const personInfo = personInfoMap.get(athlete.person);
      const teamInfo = teamInfoMap.get(athlete.team);
      const seasonInfo = seasonInfoMap.get(athlete.season);

      return {
        ...athlete,
        personFirstName: personInfo?.firstName ?? 'N/A',
        personLastName: personInfo?.lastName ?? 'N/A',
        personPreferredName: personInfo?.preferredName, // Keep potentially null/undefined
        personBirthday: personInfo?.birthday, // <<< ADDED
        personGender: personInfo?.gender, // <<< ADDED
        teamCode: teamInfo?.code ?? 'N/A',
        seasonName: seasonInfo?.season ?? 'N/A',
        seasonYear: seasonInfo?.year ?? 'N/A',
      };
    }
  );

  console.log(
    '[fetchAthletesWithContext] Returning combined athlete data:',
    athletesWithContext.length
  );
  return athletesWithContext;
};

/**
 * Custom hook to fetch athletes data using React Query.
 * Filters athletes based on super-selected seasons or teams.
 * Includes associated Person, Team, and Season information.
 * The query is automatically disabled if no relevant season/team is super-selected
 * or if the selection exceeds Firestore's 'in' query limits.
 */
export function useAthletes() {
  const { state: filterState } = useFilterContext();
  // Get IDs needed for filtering and query key reactivity
  const superSelectedSeasonIds = filterState.superSelected.season;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedTeamIds = filterState.selected.team;

  // Determine if the query should be enabled based on filter requirements and limits
  let queryEnabled = false;
  if (superSelectedSeasonIds.length > 0) {
    queryEnabled = superSelectedSeasonIds.length <= FIRESTORE_IN_QUERY_LIMIT;
  } else if (superSelectedTeamIds.length > 0) {
    queryEnabled = superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT;
  }

  console.log(
    `[useAthletes] Hook rendered. Query Enabled: ${queryEnabled}. SuperSeasons: ${superSelectedSeasonIds.length}, SuperTeams: ${superSelectedTeamIds.length}`
  );

  return useQuery<AthleteWithContextInfo[], Error>({
    // Query key includes all relevant IDs from filter context
    queryKey: [
      'athletes', // Base key
      selectedTeamIds,
      superSelectedTeamIds,
      selectedSeasonIds,
      superSelectedSeasonIds,
    ],
    queryFn: () =>
      fetchAthletesWithContext(superSelectedSeasonIds, superSelectedTeamIds),
    enabled: queryEnabled, // Dynamically enable/disable
    // staleTime: 5 * 60 * 1000, // Optional
  });
}
