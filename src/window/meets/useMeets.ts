// src/window/meets/useMeets.ts

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
import { Meet, Season, Team } from '../../models/index'; // Adjust path as needed
import { useFilterContext } from '../../filter/FilterContext'; // Import filter context hook

// Define the structure for the combined Meet, Season, and Team info (no changes needed here)
export interface MeetWithContextInfo extends Meet {
  seasonName?: string;
  seasonYear?: string;
  teamCode?: string;
  teamNameShort?: string;
}

const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * Fetches meets and joins relevant season and team info.
 * Filters meets hierarchically:
 * 1. By super-selected Seasons if any.
 * 2. Otherwise, by super-selected Teams if any.
 * 3. Otherwise, fetches all meets.
 * @param superSelectedSeasonIds - Array of IDs for super-selected seasons.
 * @param superSelectedTeamIds - Array of IDs for super-selected teams.
 * @returns Promise<MeetWithContextInfo[]> - A promise resolving to an array of meets with context info.
 */
const fetchMeetsWithContext = async (
  superSelectedSeasonIds: string[],
  superSelectedTeamIds: string[]
): Promise<MeetWithContextInfo[]> => {
  console.log(
    '[fetchMeetsWithContext] Running with superSelected Seasons:',
    superSelectedSeasonIds,
    'and superSelected Teams:',
    superSelectedTeamIds
  );

  const meetsCollectionRef = collection(db, 'meets');
  const meetsQueryConstraints: QueryConstraint[] = [orderBy('date', 'desc')]; // Default sort

  let filterApplied = false;
  let queryIsPossible = true;

  // --- 1. Prioritize filtering by Super-Selected Seasons ---
  if (superSelectedSeasonIds.length > 0) {
    filterApplied = true;
    console.log(
      '[fetchMeetsWithContext] Filtering query by super-selected seasons:',
      superSelectedSeasonIds
    );
    if (superSelectedSeasonIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
      // Filter by the 'season' field (seasonId)
      meetsQueryConstraints.unshift(
        where('season', 'in', superSelectedSeasonIds)
      );
    } else {
      console.warn(
        `[fetchMeetsWithContext] Cannot filter by more than ${FIRESTORE_IN_QUERY_LIMIT} super-selected seasons. Returning empty array.`
      );
      queryIsPossible = false;
    }
  }
  // --- 2. Else, filter by Super-Selected Teams ---
  else if (superSelectedTeamIds.length > 0 && queryIsPossible) {
    filterApplied = true;
    console.log(
      '[fetchMeetsWithContext] Filtering query by super-selected teams (no seasons super-selected):',
      superSelectedTeamIds
    );
    if (superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
      // Filter by the 'team' field (teamId) in the meet document
      meetsQueryConstraints.unshift(where('team', 'in', superSelectedTeamIds));
    } else {
      console.warn(
        `[fetchMeetsWithContext] Cannot filter by more than ${FIRESTORE_IN_QUERY_LIMIT} super-selected teams. Returning empty array.`
      );
      queryIsPossible = false;
    }
  }

  // --- 3. If no filter applied or possible, fetch all ---
  if (!filterApplied) {
    console.log(
      '[fetchMeetsWithContext] No relevant super-selections, fetching all meets.'
    );
  }

  // If the determined filter is impossible, return early
  if (!queryIsPossible) {
    return [];
  }

  // --- Execute Query ---
  const meetsQuery = query(meetsCollectionRef, ...meetsQueryConstraints);
  const meetsSnapshot = await getDocs(meetsQuery);
  const meets: Meet[] = meetsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Meet, 'id'>),
  }));

  if (meets.length === 0) {
    console.log(
      '[fetchMeetsWithContext] No matching meets found based on filters.'
    );
    return [];
  }
  console.log(`[fetchMeetsWithContext] Found ${meets.length} meets.`);

  // --- Fetch Associated Season Info (No change needed here) ---
  const uniqueSeasonIds = Array.from(
    new Set(meets.map((m) => m.season).filter(Boolean))
  );
  if (uniqueSeasonIds.length === 0) {
    console.log(
      '[fetchMeetsWithContext] No unique season IDs found, returning meets without context.'
    );
    return meets.map((meet) => ({ ...meet }));
  }
  const seasonInfoMap = new Map<
    string,
    { seasonName: string; seasonYear: string; teamId: string }
  >();
  // (Fetching logic using chunks remains the same...)
  for (let i = 0; i < uniqueSeasonIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunkSeasonIds = uniqueSeasonIds.slice(
      i,
      i + FIRESTORE_IN_QUERY_LIMIT
    );
    console.log(
      '[fetchMeetsWithContext] Fetching season chunk:',
      chunkSeasonIds
    );
    const seasonsQuery = query(
      collection(db, 'seasons'),
      where(documentId(), 'in', chunkSeasonIds)
    );
    try {
      const seasonsSnapshot = await getDocs(seasonsQuery);
      seasonsSnapshot.docs.forEach((doc) => {
        const seasonData = doc.data() as Partial<
          Pick<Season, 'season' | 'year' | 'team'>
        >;
        seasonInfoMap.set(doc.id, {
          seasonName: seasonData.season ?? 'N/A',
          seasonYear: seasonData.year ?? 'N/A',
          teamId: seasonData.team ?? '',
        });
      });
    } catch (seasonError) {
      console.error(
        '[fetchMeetsWithContext] Error fetching season chunk:',
        chunkSeasonIds,
        seasonError
      );
    }
  }
  console.log(
    '[fetchMeetsWithContext] Fetched info for seasons:',
    Array.from(seasonInfoMap.keys())
  );

  // --- Fetch Associated Team Info (No change needed here, uses teamId from fetched seasons) ---
  const uniqueTeamIds = Array.from(
    new Set(
      Array.from(seasonInfoMap.values())
        .map((sInfo) => sInfo.teamId)
        .filter(Boolean)
    )
  );
  if (uniqueTeamIds.length === 0) {
    console.log(
      '[fetchMeetsWithContext] No unique team IDs found from seasons, returning meets with only season info.'
    );
    return meets.map((meet) => {
      const seasonInfo = seasonInfoMap.get(meet.season);
      return {
        ...meet,
        seasonName: seasonInfo?.seasonName,
        seasonYear: seasonInfo?.seasonYear,
      };
    });
  }
  const teamInfoMap = new Map<
    string,
    { teamCode: string; teamNameShort: string }
  >();
  // (Fetching logic using chunks remains the same...)
  for (let i = 0; i < uniqueTeamIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunkTeamIds = uniqueTeamIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    console.log('[fetchMeetsWithContext] Fetching team chunk:', chunkTeamIds);
    const teamsQuery = query(
      collection(db, 'teams'),
      where(documentId(), 'in', chunkTeamIds)
    );
    try {
      const teamsSnapshot = await getDocs(teamsQuery);
      teamsSnapshot.docs.forEach((doc) => {
        const teamData = doc.data() as Partial<
          Pick<Team, 'code' | 'nameShort'>
        >;
        teamInfoMap.set(doc.id, {
          teamCode: teamData.code ?? 'N/A',
          teamNameShort: teamData.nameShort ?? 'N/A',
        });
      });
    } catch (teamError) {
      console.error(
        '[fetchMeetsWithContext] Error fetching team chunk:',
        chunkTeamIds,
        teamError
      );
    }
  }
  console.log(
    '[fetchMeetsWithContext] Fetched info for teams:',
    Array.from(teamInfoMap.keys())
  );

  // --- Combine Meet, Season, and Team Data (No change needed here) ---
  const meetsWithContextInfo: MeetWithContextInfo[] = meets.map((meet) => {
    const seasonInfo = seasonInfoMap.get(meet.season);
    const teamInfo = seasonInfo
      ? teamInfoMap.get(seasonInfo.teamId)
      : undefined;
    return {
      ...meet,
      seasonName: seasonInfo?.seasonName,
      seasonYear: seasonInfo?.seasonYear,
      teamCode: teamInfo?.teamCode,
      teamNameShort: teamInfo?.teamNameShort,
    };
  });

  console.log(
    '[fetchMeetsWithContext] Returning combined data:',
    meetsWithContextInfo
  );
  return meetsWithContextInfo;
};

/**
 * Custom hook to fetch meets data, filtered hierarchically by super-selected seasons or teams.
 * Includes associated season and team info.
 */
export function useMeets() {
  const { state: filterState } = useFilterContext();
  // Get IDs needed for filtering and query key reactivity
  const superSelectedSeasonIds = filterState.superSelected.season;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedTeamIds = filterState.superSelected.team; // Get super-selected teams
  const selectedTeamIds = filterState.selected.team; // Get selected teams for key

  // Determine if the active filter (if any) is within limits
  let queryEnabled = true;
  if (superSelectedSeasonIds.length > FIRESTORE_IN_QUERY_LIMIT) {
    queryEnabled = false; // Season filter is impossible
  } else if (
    superSelectedSeasonIds.length === 0 &&
    superSelectedTeamIds.length > FIRESTORE_IN_QUERY_LIMIT
  ) {
    queryEnabled = false; // Team filter (fallback) is impossible
  }

  return useQuery<MeetWithContextInfo[], Error>({
    // Query key now depends on both super-selected teams and seasons,
    // as well as selected teams/seasons for UI reactivity.
    queryKey: [
      'meets',
      selectedTeamIds,
      superSelectedTeamIds,
      selectedSeasonIds,
      superSelectedSeasonIds,
    ],
    // Pass both super-selected IDs arrays to the fetch function
    queryFn: () =>
      fetchMeetsWithContext(superSelectedSeasonIds, superSelectedTeamIds),
    // Enable query only if the active filter level is valid
    enabled: queryEnabled,
    // staleTime: 5 * 60 * 1000, // Optional
  });
}
