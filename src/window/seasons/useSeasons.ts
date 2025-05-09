import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Season } from '../../types/data';
import { useFilterContext } from '../../filter/FilterContext';

const FIRESTORE_IN_QUERY_LIMIT = 30;

const fetchSeasons = async (
  superSelectedTeamIds: string[]
): Promise<Season[]> => {
  const seasonsQueryConstraints: QueryConstraint[] = [
    orderBy('endDate', 'desc'),
  ];

  if (superSelectedTeamIds.length > 0) {
    seasonsQueryConstraints.unshift(
      where('team.id', 'in', superSelectedTeamIds)
    );
  }

  const seasonsRef = collection(db, 'seasons');
  const seasonsQueryInstance = query(seasonsRef, ...seasonsQueryConstraints);
  const seasonsSnapshot = await getDocs(seasonsQueryInstance);

  const seasons: Season[] = seasonsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Season, 'id'>),
  }));

  return seasons;
};

export function useSeasons() {
  const { state: filterState } = useFilterContext();
  const superSelectedTeamIds = filterState.superSelected.team;

  const queryEnabled =
    superSelectedTeamIds.length === 0 ||
    superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT;

  return useQuery<Season[], Error>({
    queryKey: ['seasons', superSelectedTeamIds],
    queryFn: () => fetchSeasons(superSelectedTeamIds),
    enabled: queryEnabled,
  });
}
