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
import { Result } from '../../types/data'; // Result type includes all embedded denormalized data
import { useFilterContext } from '../../filter/FilterContext';

const FIRESTORE_IN_QUERY_LIMIT = 30;

const fetchResults = async (
  teamIds: string[],
  seasonIds: string[],
  meetIds: string[],
  eventIds: string[],
  athleteIds: string[],
  personIds: string[]
): Promise<Result[]> => {
  const resultsCollectionRef = collection(db, 'results');
  const queryConstraints: QueryConstraint[] = [
    orderBy('meet.date', 'desc'), // Sort by meet date (most recent first)
    orderBy('result', 'asc'), // Then by result time (fastest first)
    // Requires Firestore index on (meet.date DESC, result ASC)
  ];

  // Apply server-side 'in' filters if IDs are provided and within limits (checked by 'enabled' in hook)
  if (teamIds.length > 0) {
    queryConstraints.unshift(where('team.id', 'in', teamIds));
  }
  if (seasonIds.length > 0) {
    queryConstraints.unshift(where('season.id', 'in', seasonIds));
  }
  if (meetIds.length > 0) {
    queryConstraints.unshift(where('meet.id', 'in', meetIds));
  }
  if (eventIds.length > 0) {
    queryConstraints.unshift(where('event.id', 'in', eventIds));
  }

  const resultsQuery = query(resultsCollectionRef, ...queryConstraints);
  const snapshot = await getDocs(resultsQuery);
  let results: Result[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Result, 'id'>),
  }));

  // Client-side filtering for Athletes
  if (athleteIds.length > 0) {
    const athleteIdSet = new Set(athleteIds);
    results = results.filter((result) =>
      result.athletes.some((athlete) => athleteIdSet.has(athlete.id))
    );
  }

  // Client-side filtering for Persons (via athletes array)
  if (personIds.length > 0) {
    const personIdSet = new Set(personIds);
    results = results.filter((result) =>
      result.athletes.some((athlete) => personIdSet.has(athlete.person.id))
    );
  }

  return results;
};

export function useResults() {
  const { state: filterState } = useFilterContext();
  const {
    team: superSelectedTeamIds,
    season: superSelectedSeasonIds,
    meet: superSelectedMeetIds,
    event: superSelectedEventIds,
    athlete: superSelectedAthleteIds,
    person: superSelectedPersonIds,
  } = filterState.superSelected;

  const primaryScopedFilters = [
    { ids: superSelectedTeamIds },
    { ids: superSelectedSeasonIds },
    { ids: superSelectedMeetIds },
    { ids: superSelectedEventIds },
  ];

  let queryEnabled = false;
  const activePrimaryFilters = primaryScopedFilters.filter(
    (f) => f.ids.length > 0
  );

  if (activePrimaryFilters.length > 0) {
    // Query is enabled if at least one primary filter is active AND
    // all active primary filters are within Firestore's 'in' query limits.
    queryEnabled = activePrimaryFilters.every(
      (f) => f.ids.length <= FIRESTORE_IN_QUERY_LIMIT
    );
  }
  // Athlete/Person filters are applied client-side and do not gate the query if primary filters are valid.

  return useQuery<Result[], Error>({
    queryKey: [
      'results',
      superSelectedTeamIds,
      superSelectedSeasonIds,
      superSelectedMeetIds,
      superSelectedEventIds,
      superSelectedAthleteIds,
      superSelectedPersonIds,
    ],
    queryFn: () =>
      fetchResults(
        superSelectedTeamIds,
        superSelectedSeasonIds,
        superSelectedMeetIds,
        superSelectedEventIds,
        superSelectedAthleteIds,
        superSelectedPersonIds
      ),
    enabled: queryEnabled,
  });
}
