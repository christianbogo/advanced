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
import { Result } from '../../types/data';
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
    orderBy('meet.date', 'desc'),
    orderBy('result', 'asc'),
  ];

  // Apply server-side 'in' filters if IDs are provided and within limits (checked by 'enabled' in hook)
  if (teamIds.length > 0) {
    queryConstraints.unshift(where('meet.season.team.id', 'in', teamIds)); // CORRECTED
  }
  if (seasonIds.length > 0) {
    queryConstraints.unshift(where('meet.season.id', 'in', seasonIds)); // CORRECTED
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
      result.athletes.some((athlete) => {
        // Add a check for athlete.person to prevent potential errors if an athlete object might not have a person
        return athlete.person && personIdSet.has(athlete.person.id);
      })
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
    athlete: superSelectedAthleteIds, // Used for client-side filtering in fetchResults
    person: superSelectedPersonIds, // Used for client-side filtering in fetchResults
  } = filterState.superSelected;

  // Filters that determine if a server-side query should even run.
  // Athlete and Person filters are applied client-side after an initial fetch based on these.
  const serverQueryFilters = [
    { ids: superSelectedTeamIds, field: 'meet.season.team.id' }, // For Firestore query
    { ids: superSelectedSeasonIds, field: 'meet.season.id' }, // For Firestore query
    { ids: superSelectedMeetIds, field: 'meet.id' },
    { ids: superSelectedEventIds, field: 'event.id' },
  ];

  let queryEnabled = false;
  const activeServerFilters = serverQueryFilters.filter(
    (f) => f.ids.length > 0
  );

  if (activeServerFilters.length > 0) {
    // Query is enabled if at least one of these server-filterable categories is active AND
    // all such active filters are within Firestore's 'in' query limits.
    queryEnabled = activeServerFilters.every(
      (f) => f.ids.length <= FIRESTORE_IN_QUERY_LIMIT
    );
  }
  // If you want the query to run even if only athlete/person filters are selected (relying on client-side filtering),
  // you'd adjust the queryEnabled logic. But typically, you want some broader scope (team, season, meet, event)
  // for the initial fetch.

  return useQuery<Result[], Error>({
    queryKey: [
      'results',
      superSelectedTeamIds,
      superSelectedSeasonIds,
      superSelectedMeetIds,
      superSelectedEventIds,
      superSelectedAthleteIds, // Part of key because fetchResults uses it for client filtering
      superSelectedPersonIds, // Part of key because fetchResults uses it for client filtering
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
