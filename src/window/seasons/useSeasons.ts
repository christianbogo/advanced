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
 * This is what the hook will return in its `data` array.
 */
export interface SeasonWithTeamInfo extends Season {
  teamCode?: string; // Add optional team code
  teamNameShort?: string; // Add optional team short name
}

/**
 * Fetches seasons based on selected team filters and joins relevant team info.
 * @param selectedTeamIds - Array of IDs for normally selected teams.
 * @param superSelectedTeamIds - Array of IDs for super-selected teams.
 * @returns Promise<SeasonWithTeamInfo[]> - A promise resolving to an array of seasons with team info.
 */
const fetchSeasonsWithTeams = async (
  selectedTeamIds: string[],
  superSelectedTeamIds: string[]
): Promise<SeasonWithTeamInfo[]> => {
  console.log(
    '[fetchSeasonsWithTeams] Running with selected:',
    selectedTeamIds,
    'superSelected:',
    superSelectedTeamIds
  );

  const hasSuperSelected = superSelectedTeamIds.length > 0;
  const hasSelected = selectedTeamIds.length > 0;
  let targetTeamIds: string[] = [];
  let shouldFetchAll = false;

  // Determine which team IDs to filter by
  if (hasSuperSelected) {
    targetTeamIds = superSelectedTeamIds;
    console.log(
      '[fetchSeasonsWithTeams] Filtering by super-selected teams:',
      targetTeamIds
    );
  } else if (hasSelected) {
    targetTeamIds = selectedTeamIds;
    console.log(
      '[fetchSeasonsWithTeams] Filtering by selected teams:',
      targetTeamIds
    );
  } else {
    // If no teams are selected/super-selected, fetch all seasons
    shouldFetchAll = true;
    console.log(
      '[fetchSeasonsWithTeams] No teams selected, fetching all seasons.'
    );
  }

  // If filtering is active but results in no target IDs, return empty immediately
  if (!shouldFetchAll && targetTeamIds.length === 0) {
    console.log(
      '[fetchSeasonsWithTeams] Filtering active but no target team IDs, returning empty.'
    );
    return [];
  }

  // --- 1. Fetch Filtered Seasons ---
  const seasonsQueryConstraints: QueryConstraint[] = [
    orderBy('endDate', 'desc'),
  ]; // Default sort
  if (!shouldFetchAll) {
    // Add the 'where' clause only if filtering by specific teams
    // Firestore 'in' query requires a non-empty array and max 10 elements (consider chunking if > 10)
    // For simplicity, assuming <= 10 selected teams. Handle > 10 if necessary.
    if (targetTeamIds.length > 0 && targetTeamIds.length <= 30) {
      // Firestore 'in' query limit is 30
      seasonsQueryConstraints.unshift(where('team', 'in', targetTeamIds));
    } else if (targetTeamIds.length > 30) {
      console.warn(
        '[fetchSeasonsWithTeams] Cannot filter by more than 30 teams with "in" query. Fetching all seasons instead.'
      );
      // Fallback to fetching all if too many selected (alternative: multiple queries)
      shouldFetchAll = true;
      seasonsQueryConstraints.shift(); // Remove the where clause if it was added
    } else {
      // This case shouldn't be reached due to the check above, but safety first
      return [];
    }
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
    return []; // No seasons match the filter or none exist
  }
  console.log(`[fetchSeasonsWithTeams] Found ${seasons.length} seasons.`);

  // --- 2. Fetch Associated Team Info ---
  // Get unique team IDs from the fetched seasons
  const uniqueTeamIds = [
    ...Array.from(new Set(seasons.map((s) => s.team).filter(Boolean))),
  ]; // Filter out potential undefined/null

  if (uniqueTeamIds.length === 0) {
    console.log(
      '[fetchSeasonsWithTeams] No unique team IDs found in seasons, returning seasons without team info.'
    );
    // Should not happen if seasons have valid team refs, but handle defensively
    return seasons; // Return seasons as is, team info will be undefined
  }

  // Fetch only the necessary fields for the required teams
  // Chunk the query if more than 30 unique team IDs are needed
  const teamInfoMap = new Map<string, { code: string; nameShort: string }>();
  const CHUNK_SIZE = 30; // Firestore 'in' query limit
  for (let i = 0; i < uniqueTeamIds.length; i += CHUNK_SIZE) {
    const chunkTeamIds = uniqueTeamIds.slice(i, i + CHUNK_SIZE);
    const teamsQuery = query(
      collection(db, 'teams'),
      where(documentId(), 'in', chunkTeamIds)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    teamsSnapshot.docs.forEach((doc) => {
      const teamData = doc.data() as Partial<Pick<Team, 'code' | 'nameShort'>>;
      teamInfoMap.set(doc.id, {
        code: teamData.code ?? 'N/A', // Provide default
        nameShort: teamData.nameShort ?? 'N/A', // Provide default
      });
    });
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
      teamCode: teamInfo?.code,
      teamNameShort: teamInfo?.nameShort,
    };
  });

  console.log(
    '[fetchSeasonsWithTeams] Returning combined data:',
    seasonsWithTeamInfo
  );
  return seasonsWithTeamInfo;
};

/**
 * Custom hook to fetch seasons data based on selected teams, including team info.
 * Handles fetching, caching, filtering, loading, and error states.
 */
export function useSeasons() {
  // Get the current filter state
  const { state: filterState } = useFilterContext();
  const { selected: selectedTeamsMap, superSelected: superSelectedTeamsMap } =
    filterState;
  const selectedTeamIds = selectedTeamsMap.team;
  const superSelectedTeamIds = superSelectedTeamsMap.team;

  // Determine if filtering is active based on selections
  const isFilterActive =
    selectedTeamIds.length > 0 || superSelectedTeamIds.length > 0;
  // Determine the actual IDs to query by
  const targetTeamIds =
    superSelectedTeamIds.length > 0 ? superSelectedTeamIds : selectedTeamIds;

  // The query should run if:
  // 1. No filter is active (fetch all)
  // 2. A filter is active AND there are target team IDs to filter by
  const queryEnabled = !isFilterActive || targetTeamIds.length > 0;

  return useQuery<SeasonWithTeamInfo[], Error>({
    // Query key MUST include dependencies that affect the query result
    queryKey: ['seasons', selectedTeamIds, superSelectedTeamIds],
    // Pass the filter IDs to the fetch function
    queryFn: () => fetchSeasonsWithTeams(selectedTeamIds, superSelectedTeamIds),
    // Enable the query based on the logic above
    enabled: queryEnabled,
    // Optional: Configure staleTime, cacheTime, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
