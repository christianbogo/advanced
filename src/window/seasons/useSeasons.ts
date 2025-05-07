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
import { db } from '../../firebase/firebase';
import { Season, Team } from '../../models/index';
import { useFilterContext } from '../../filter/FilterContext';

export interface SeasonWithTeamInfo extends Season {
  teamCode?: string;
  teamNameShort?: string;
}

const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * Fetches seasons and joins relevant team info.
 * Filters seasons based on super-selected team IDs.
 * @param superSelectedTeamIds - Array of IDs for super-selected teams.
 * @returns Promise<SeasonWithTeamInfo[]> - A promise resolving to an array of seasons with team info.
 */
const fetchSeasonsWithTeams = async (
  superSelectedTeamIds: string[]
): Promise<SeasonWithTeamInfo[]> => {
  const hasSuperSelected = superSelectedTeamIds.length > 0;
  const seasonsQueryConstraints: QueryConstraint[] = [
    orderBy('endDate', 'desc'),
  ];

  if (hasSuperSelected) {
    if (
      superSelectedTeamIds.length > 0 &&
      superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT
    ) {
      seasonsQueryConstraints.unshift(
        where('team', 'in', superSelectedTeamIds)
      );
    } else if (superSelectedTeamIds.length > FIRESTORE_IN_QUERY_LIMIT) {
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
    return [];
  }

  const uniqueTeamIds = Array.from(
    new Set(seasons.map((s) => s.team).filter((id): id is string => !!id))
  );

  if (uniqueTeamIds.length === 0) {
    return seasons.map((season) => ({
      ...season,
      teamCode: undefined,
      teamNameShort: undefined,
    }));
  }

  const teamInfoMap = new Map<string, { code: string; nameShort: string }>();

  for (let i = 0; i < uniqueTeamIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunkTeamIds = uniqueTeamIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
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
          code: teamData.code ?? 'N/A',
          nameShort: teamData.nameShort ?? 'N/A',
        });
      });
    } catch (teamError) {
      console.error(
        '[fetchSeasonsWithTeams] Error fetching team chunk:',
        chunkTeamIds,
        teamError
      );
    }
  }

  const seasonsWithTeamInfo: SeasonWithTeamInfo[] = seasons.map((season) => {
    const teamInfo = season.team ? teamInfoMap.get(season.team) : undefined;
    return {
      ...season,
      teamCode: teamInfo?.code,
      teamNameShort: teamInfo?.nameShort,
    };
  });

  return seasonsWithTeamInfo;
};

export function useSeasons() {
  const { state: filterState } = useFilterContext();
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedTeamIds = filterState.selected.team;

  const queryEnabled =
    superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT ||
    superSelectedTeamIds.length === 0;

  return useQuery<SeasonWithTeamInfo[], Error>({
    queryKey: ['seasons', selectedTeamIds, superSelectedTeamIds],
    queryFn: () => fetchSeasonsWithTeams(superSelectedTeamIds),
    enabled: queryEnabled,
  });
}
