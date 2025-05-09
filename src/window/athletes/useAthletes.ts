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
import { Athlete } from '../../types/data';
import { useFilterContext } from '../../filter/FilterContext';

const FIRESTORE_IN_QUERY_LIMIT = 30;

const fetchAthletes = async (
  superSelectedSeasonIds: string[],
  superSelectedTeamIds: string[]
): Promise<Athlete[]> => {
  const athletesCollectionRef = collection(db, 'athletes');
  const athletesQueryConstraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
  ];

  if (superSelectedSeasonIds.length > 0) {
    athletesQueryConstraints.unshift(
      where('season.id', 'in', superSelectedSeasonIds)
    );
  } else if (superSelectedTeamIds.length > 0) {
    athletesQueryConstraints.unshift(
      where('season.team.id', 'in', superSelectedTeamIds)
    );
  }

  const athletesQueryInstance = query(
    athletesCollectionRef,
    ...athletesQueryConstraints
  );
  const athletesSnapshot = await getDocs(athletesQueryInstance);

  const athletes: Athlete[] = athletesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Athlete, 'id'>),
  }));

  return athletes;
};

export function useAthletes() {
  const { state: filterState } = useFilterContext();
  const superSelectedSeasonIds = filterState.superSelected.season;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedTeamIds = filterState.selected.team;

  let queryEnabled = false;
  if (superSelectedSeasonIds.length > 0) {
    queryEnabled = superSelectedSeasonIds.length <= FIRESTORE_IN_QUERY_LIMIT;
  } else if (superSelectedTeamIds.length > 0) {
    queryEnabled = superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT;
  }

  return useQuery<Athlete[], Error>({
    queryKey: [
      'athletes',
      superSelectedTeamIds,
      superSelectedSeasonIds,
      selectedTeamIds,
      selectedSeasonIds,
    ],
    queryFn: () => fetchAthletes(superSelectedSeasonIds, superSelectedTeamIds),
    enabled: queryEnabled,
  });
}
