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
import { Meet } from '../../types/data'; // Meet type itself will include embedded Season and Team types
import { useFilterContext } from '../../filter/FilterContext';

const FIRESTORE_IN_QUERY_LIMIT = 30;

const fetchMeets = async (
  superSelectedSeasonIds: string[],
  superSelectedTeamIds: string[]
): Promise<Meet[]> => {
  const meetsCollectionRef = collection(db, 'meets');
  const meetsQueryConstraints: QueryConstraint[] = [orderBy('date', 'desc')];

  if (superSelectedSeasonIds.length > 0) {
    meetsQueryConstraints.unshift(
      where('season.id', 'in', superSelectedSeasonIds)
    );
  } else if (superSelectedTeamIds.length > 0) {
    meetsQueryConstraints.unshift(where('team.id', 'in', superSelectedTeamIds));
  }

  const meetsQueryInstance = query(
    meetsCollectionRef,
    ...meetsQueryConstraints
  );
  const meetsSnapshot = await getDocs(meetsQueryInstance);

  const meets: Meet[] = meetsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Meet, 'id'>),
  }));

  return meets;
};

export function useMeets() {
  const { state: filterState } = useFilterContext();
  const superSelectedSeasonIds = filterState.superSelected.season;
  const selectedSeasonIds = filterState.selected.season;
  const superSelectedTeamIds = filterState.superSelected.team;
  const selectedTeamIds = filterState.selected.team;

  let queryEnabled = true;
  if (superSelectedSeasonIds.length > 0) {
    if (superSelectedSeasonIds.length > FIRESTORE_IN_QUERY_LIMIT) {
      queryEnabled = false;
    }
  } else if (superSelectedTeamIds.length > 0) {
    if (superSelectedTeamIds.length > FIRESTORE_IN_QUERY_LIMIT) {
      queryEnabled = false;
    }
  }

  return useQuery<Meet[], Error>({
    queryKey: [
      'meets',
      superSelectedTeamIds,
      superSelectedSeasonIds,
      selectedTeamIds,
      selectedSeasonIds,
    ],
    queryFn: () => fetchMeets(superSelectedSeasonIds, superSelectedTeamIds),
    enabled: queryEnabled,
  });
}
