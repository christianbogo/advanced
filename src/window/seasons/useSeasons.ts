// src/window/seasons/useSeasons.ts

import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  documentId, // Import documentId for querying by ID
  QueryConstraint, // Import type for query constraints
} from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Season, Team } from '../../models/index'; // Adjust path as needed
import { useFilterContext } from '../../filter/FilterContext'; // Import filter context hook

/**
 * Define the structure for the combined Season and Team info.
 */
export interface SeasonWithTeamInfo extends Season {
  teamCode?: string; // Add optional team code
  teamNameShort?: string; // Add optional team short name
}

/**
 * Fetches seasons and joins relevant team info.
 * Filters seasons ONLY if teams are super-selected.
 * @param superSelectedTeamIds - Array of IDs for super-selected teams.
 * @returns Promise<SeasonWithTeamInfo[]> - A promise resolving to an array of seasons with team info.
 */
const fetchSeasonsWithTeams = async (
  superSelectedTeamIds: string[] // Only need super-selected IDs for filtering query
): Promise<SeasonWithTeamInfo[]> => {
  console.log(
    '[fetchSeasonsWithTeams] Running with superSelected:',
    superSelectedTeamIds
  );

  const hasSuperSelected = superSelectedTeamIds.length > 0;

  // --- 1. Fetch Seasons (Filtered only by Super-Selection) ---
  const seasonsQueryConstraints: QueryConstraint[] = [
    orderBy('endDate', 'desc'),
  ]; // Default sort

  if (hasSuperSelected) {
    if (superSelectedTeamIds.length > 0 && superSelectedTeamIds.length <= 30) {
      console.log(
        '[fetchSeasonsWithTeams] Filtering query by super-selected teams:',
        superSelectedTeamIds
      );
      seasonsQueryConstraints.unshift(
        where('team', 'in', superSelectedTeamIds)
      );
    } else if (superSelectedTeamIds.length > 30) {
      console.warn(
        '[fetchSeasonsWithTeams] Cannot filter by more than 30 super-selected teams. Returning empty array.'
      );
      return [];
    }
  } else {
    console.log(
      '[fetchSeasonsWithTeams] No teams super-selected, fetching all seasons.'
    );
  }

  const seasonsQuery = query(
    collection(db, 'seasons'),
    ...seasonsQueryConstraints
  );
  const seasonsSnapshot = await getDocs(seasonsQuery);
  const seasons: Season[] = seasonsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Season, 'id'>),
  }));

  if (seasons.length === 0) {
    console.log('[fetchSeasonsWithTeams] No matching seasons found.');
    return [];
  }
  console.log(`[fetchSeasonsWithTeams] Found ${seasons.length} seasons.`);

  // --- 2. Fetch Associated Team Info ---
  // Get unique team IDs from the fetched seasons
  // FIX: Removed extra array brackets around Array.from(...)
  const uniqueTeamIds = Array.from(
    new Set(seasons.map((s) => s.team).filter(Boolean))
  );

  if (uniqueTeamIds.length === 0) {
    console.log(
      '[fetchSeasonsWithTeams] No unique team IDs found in seasons, returning seasons without team info.'
    );
    return seasons; // Return seasons as is, team info will be undefined
  }

  // Fetch only the necessary fields for the required teams
  // Chunk the query if more than 30 unique team IDs are needed
  const teamInfoMap = new Map<string, { code: string; nameShort: string }>();
  const CHUNK_SIZE = 30; // Firestore 'in' query limit
  for (let i = 0; i < uniqueTeamIds.length; i += CHUNK_SIZE) {
    // chunkTeamIds will now correctly be a flat array of strings
    const chunkTeamIds = uniqueTeamIds.slice(i, i + CHUNK_SIZE);
    console.log('[fetchSeasonsWithTeams] Fetching team chunk:', chunkTeamIds); // Log the chunk
    const teamsQuery = query(
      collection(db, 'teams'),
      // This query should now work correctly
      where(documentId(), 'in', chunkTeamIds)
    );
    try {
      // Add try-catch for team fetching errors
      const teamsSnapshot = await getDocs(teamsQuery);
      teamsSnapshot.docs.forEach((doc) => {
        const teamData = doc.data() as Partial<
          Pick<Team, 'code' | 'nameShort'>
        >;
        teamInfoMap.set(doc.id, {
          code: teamData.code ?? 'N/A', // Provide default
          nameShort: teamData.nameShort ?? 'N/A', // Provide default
        });
      });
    } catch (teamError) {
      console.error(
        '[fetchSeasonsWithTeams] Error fetching team chunk:',
        chunkTeamIds,
        teamError
      );
      // Decide how to handle partial failure: continue without info for this chunk, or throw?
      // Continuing for now, missing teams will have N/A
    }
  }
  console.log(
    '[fetchSeasonsWithTeams] Fetched info for teams:',
    Array.from(teamInfoMap.keys())
  );

  // --- 3. Combine Season and Team Data ---
  const seasonsWithTeamInfo: SeasonWithTeamInfo[] = seasons.map((season) => {
    const teamInfo = teamInfoMap.get(season.team);
    return {
      ...season,
      teamCode: teamInfo?.code, // Will be undefined if team fetch failed or team missing
      teamNameShort: teamInfo?.nameShort, // Will be undefined if team fetch failed or team missing
    };
  });

  console.log(
    '[fetchSeasonsWithTeams] Returning combined data:',
    seasonsWithTeamInfo
  );
  return seasonsWithTeamInfo;
};

/**
 * Custom hook to fetch seasons data, filtered ONLY by super-selected teams.
 * Includes associated team info.
 */
export function useSeasons() {
  const { state: filterState } = useFilterContext();
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedTeamIds = filterState.selected.team;

  const queryEnabled = superSelectedTeamIds.length <= 30;

  return useQuery<SeasonWithTeamInfo[], Error>({
    // Key depends on super-selected teams as they affect the query.
    // Include selected teams too, as changes to them might trigger related actions.
    queryKey: ['seasons', selectedTeamIds, superSelectedTeamIds],
    // Only pass superSelectedTeamIds to the fetch function
    queryFn: () => fetchSeasonsWithTeams(superSelectedTeamIds),
    // Disable query only if super-selection is impossible (>30)
    enabled: queryEnabled,
    // staleTime: 5 * 60 * 1000,
  });
}
