// src/hooks/useResults.ts  (or wherever you keep your data hooks)

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
import { Result, Person, Event, Meet } from '../../models/index'; // Adjust path as needed
import { useFilterContext } from '../../filter/FilterContext'; // Adjust path as needed

// --- Constants ---
const FIRESTORE_IN_QUERY_LIMIT = 30; // Firestore 'in' query limit

// --- Interfaces ---
/**
 * Combines the base Result data with fetched context information
 * for display purposes.
 */
export interface ResultWithContextInfo extends Result {
  personNames: string[]; // Array of names corresponding to persons array
  eventString: string; // Formatted event description (e.g., "100 FR SCY")
  meetNameShort?: string; // Short name of the meet
  meetDate?: string; // Date of the meet (e.g., "YYYY-MM-DD")
  // Optional context fields you might add later:
  // teamCode?: string;
  // seasonName?: string;
  // seasonYear?: string;
}

// --- Helper: Fetch Chunked Data ---
// (Assuming a similar helper exists or you adapt this from useAthletes/useMeets)
async function fetchChunkedData<T extends { id?: string }>(
  ids: string[],
  collectionName: string
): Promise<Map<string, Partial<T>>> {
  const map = new Map<string, Partial<T>>();
  if (ids.length === 0) {
    return map; // Return empty map if no IDs
  }

  for (let i = 0; i < ids.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunkIds = ids.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    if (chunkIds.length === 0) continue;
    try {
      const chunkQuery = query(
        collection(db, collectionName),
        where(documentId(), 'in', chunkIds)
      );
      const snapshot = await getDocs(chunkQuery);
      snapshot.docs.forEach((doc) => {
        // Ensure 'id' is included if the base type doesn't explicitly have it
        map.set(doc.id, { id: doc.id, ...doc.data() } as Partial<T>);
      });
    } catch (error) {
      console.error(
        `[fetchChunkedData] Error fetching ${collectionName} chunk:`,
        chunkIds,
        error
      );
      // Decide how to handle errors - log and continue, or throw?
      // For robustness, let's log and continue, returning potentially partial data
    }
  }
  // console.log(`[useResults] Fetched info for ${map.size} ${collectionName}.`);
  return map;
}

// --- Main Fetch Function ---
/**
 * Fetches results, applies filtering based on super-selections,
 * and joins context information (Person names, Event string, Meet details).
 * Handles Firestore query limitations by potentially applying some filters client-side.
 */
const fetchResultsWithContext = async (
  superSelectedTeamIds: string[],
  superSelectedSeasonIds: string[],
  superSelectedMeetIds: string[],
  superSelectedAthleteIds: string[],
  superSelectedPersonIds: string[]
): Promise<ResultWithContextInfo[]> => {
  const loggerArgs = {
    teams: superSelectedTeamIds.length,
    seasons: superSelectedSeasonIds.length,
    meets: superSelectedMeetIds.length,
    athletes: superSelectedAthleteIds.length,
    persons: superSelectedPersonIds.length,
  };
  console.log('[fetchResults] Running with SuperSelections count:', loggerArgs);

  const resultsCollectionRef = collection(db, 'results');
  const queryConstraints: QueryConstraint[] = [];
  let needsClientSideAthleteFilter = false;
  let needsClientSidePersonFilter = false;

  // --- Determine Query Strategy ---
  const hasTeamFilter = superSelectedTeamIds.length > 0;
  const hasSeasonFilter = superSelectedSeasonIds.length > 0;
  const hasMeetFilter = superSelectedMeetIds.length > 0;
  const hasAthleteFilter = superSelectedAthleteIds.length > 0;
  const hasPersonFilter = superSelectedPersonIds.length > 0;

  const hasAnyFilter =
    hasTeamFilter ||
    hasSeasonFilter ||
    hasMeetFilter ||
    hasAthleteFilter ||
    hasPersonFilter;

  // Flag to track if a filter that might conflict with array-contains was added
  let potentialConflictFilterAdded = false;

  if (hasAnyFilter) {
    console.log('[fetchResults] Applying server-side filters where possible.');

    // Apply Team, Season, Meet filters first (using 'in')
    if (hasTeamFilter) {
      if (superSelectedTeamIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
        queryConstraints.push(where('team', 'in', superSelectedTeamIds));
        potentialConflictFilterAdded = true;
      } else {
        console.warn(
          `[fetchResults] Too many teams (${superSelectedTeamIds.length}) super-selected. Returning empty.`
        );
        return []; // Exceeds Firestore limit
      }
    }
    if (hasSeasonFilter) {
      if (superSelectedSeasonIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
        queryConstraints.push(where('season', 'in', superSelectedSeasonIds));
        potentialConflictFilterAdded = true;
      } else {
        console.warn(
          `[fetchResults] Too many seasons (${superSelectedSeasonIds.length}) super-selected. Returning empty.`
        );
        return []; // Exceeds Firestore limit
      }
    }
    if (hasMeetFilter) {
      if (superSelectedMeetIds.length <= FIRESTORE_IN_QUERY_LIMIT) {
        queryConstraints.push(where('meet', 'in', superSelectedMeetIds));
        potentialConflictFilterAdded = true;
      } else {
        console.warn(
          `[fetchResults] Too many meets (${superSelectedMeetIds.length}) super-selected. Returning empty.`
        );
        return []; // Exceeds Firestore limit
      }
    }

    // Handle Athlete/Person Filters (array-contains)
    // **Crucial Assumption:** Firestore usually only allows ONE array-contains
    // filter, and it often cannot be combined reliably with 'in' filters.
    // We will try to add ONE array-contains if no 'in' filters are present,
    // otherwise, defer to client-side filtering.

    if (hasAthleteFilter) {
      if (
        superSelectedAthleteIds.length === 1 &&
        !potentialConflictFilterAdded &&
        !hasPersonFilter // Don't try if person filter is also active
      ) {
        // Only attempt server-side if it's the *only* filter type active
        queryConstraints.push(
          where('athletes', 'array-contains', superSelectedAthleteIds[0])
        );
        console.log(
          '[fetchResults] Applying server-side athlete filter (array-contains).'
        );
      } else {
        // Requires client-side filtering due to >1 athlete or conflicts
        console.log('[fetchResults] Athlete filter requires client-side.');
        needsClientSideAthleteFilter = true;
      }
    }

    if (hasPersonFilter) {
      if (
        superSelectedPersonIds.length === 1 &&
        !potentialConflictFilterAdded &&
        !hasAthleteFilter // Don't try if athlete filter already attempted server-side
      ) {
        // Only attempt server-side if it's the *only* filter type active
        queryConstraints.push(
          where('persons', 'array-contains', superSelectedPersonIds[0])
        );
        console.log(
          '[fetchResults] Applying server-side person filter (array-contains).'
        );
      } else {
        // Requires client-side filtering
        console.log('[fetchResults] Person filter requires client-side.');
        needsClientSidePersonFilter = true;
      }
    }
  } else {
    console.log('[fetchResults] No super-selections active, fetching all.');
  }

  // Add default sorting (MUST have a corresponding index in Firestore)
  // Sorting by meet date might be more intuitive than createdAt
  // If sorting by meet date, it implies fetching meet data first or handling complex queries.
  // Let's stick with createdAt for simplicity for now. Ensure index exists.
  queryConstraints.push(orderBy('createdAt', 'desc'));

  // --- Execute Firestore Query ---
  let results: Result[] = [];
  try {
    const resultsQuery = query(resultsCollectionRef, ...queryConstraints);
    const snapshot = await getDocs(resultsQuery);
    results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Result, 'id'>), // Assumes data structure matches Result interface
    }));
    console.log(
      `[fetchResults] Fetched ${results.length} results from Firestore.`
    );
  } catch (error: any) {
    console.error('[fetchResults] Error fetching results from Firestore:', {
      message: error.message,
      code: error.code, // Firestore error code can be helpful
      constraints: queryConstraints.map(
        (c) =>
          c.type +
          ': ' +
          (c as any)._field?.segments?.join('.') +
          ' ' +
          (c as any)._op +
          ' ' +
          (c as any)._value
      ), // Basic logging, might need refinement
    });
    // Depending on the error (e.g., index missing), you might want to throw
    // For now, rethrow to let React Query handle it
    throw error;
  }

  // --- Client-Side Filtering (Apply if flagged) ---
  let filteredResults = results; // Start with Firestore results

  if (needsClientSideAthleteFilter) {
    const filterCount = superSelectedAthleteIds.length;
    console.log(
      `[fetchResults] Applying client-side filter for ${filterCount} athletes.`
    );
    const superSelectedAthleteSet = new Set(superSelectedAthleteIds);
    filteredResults = filteredResults.filter((result) =>
      (result.athletes || []).some((athleteId) =>
        superSelectedAthleteSet.has(athleteId)
      )
    );
    console.log(
      `[fetchResults] ${filteredResults.length} results after client athlete filter.`
    );
  }

  if (needsClientSidePersonFilter) {
    const filterCount = superSelectedPersonIds.length;
    console.log(
      `[fetchResults] Applying client-side filter for ${filterCount} persons.`
    );
    const superSelectedPersonSet = new Set(superSelectedPersonIds);
    filteredResults = filteredResults.filter((result) =>
      (result.persons || []).some((personId) =>
        superSelectedPersonSet.has(personId)
      )
    );
    console.log(
      `[fetchResults] ${filteredResults.length} results after client person filter.`
    );
  }

  // Early exit if no results after filtering
  if (filteredResults.length === 0) {
    console.log('[fetchResults] No results remaining after all filtering.');
    return [];
  }

  // --- Fetch Context Data for Filtered Results ---
  const personIds = Array.from(
    new Set(filteredResults.flatMap((r) => r.persons || []))
  );
  const eventIds = Array.from(
    new Set(filteredResults.map((r) => r.event).filter(Boolean))
  );
  const meetIds = Array.from(
    new Set(filteredResults.map((r) => r.meet).filter(Boolean))
  );

  // Fetch context data concurrently
  const [personMap, eventMap, meetMap] = await Promise.all([
    fetchChunkedData<Person>(personIds, 'people'),
    fetchChunkedData<Event>(eventIds, 'events'),
    fetchChunkedData<Meet>(meetIds, 'meets'),
  ]);

  // --- Combine Data & Add Context ---
  const resultsWithContext: ResultWithContextInfo[] = filteredResults.map(
    (result) => {
      // Get Person Names
      const personNames = (result.persons || [])
        .map((pid) => {
          const person = personMap.get(pid);
          // Construct name: Preferred || First + Last
          const firstName = person?.preferredName || person?.firstName;
          const lastName = person?.lastName;
          return `${firstName || ''} ${lastName || ''}`.trim() || null; // Return null if name is empty
        })
        .filter((name): name is string => name !== null && name !== '') || [
        // Provide a default if no valid names found // Filter out null/empty names
        `Unknown Person(s)`,
      ];

      // Get Event String
      let eventString = `Unknown Event`;
      const event = eventMap.get(result.event);
      if (event) {
        // Ensure all parts exist or provide defaults
        eventString = `${event.distance || '?'} ${event.stroke || '?'} ${event.course || '?'}`;
      }

      // Get Meet Details
      const meet = meetMap.get(result.meet);
      const meetNameShort = meet?.nameShort;
      const meetDate = meet?.date; // Assuming date is 'YYYY-MM-DD' string

      return {
        ...result,
        personNames: personNames,
        eventString,
        meetNameShort,
        meetDate,
      };
    }
  );

  console.log(
    `[fetchResults] Returning ${resultsWithContext.length} results with context.`
  );
  return resultsWithContext;
};

// --- Custom React Query Hook ---
/**
 * Fetches results data with context, automatically filtered by super-selections
 * from FilterContext. Handles potential client-side filtering due to Firestore
 * query limitations.
 */
export function useResults() {
  const { state: filterState } = useFilterContext();

  // Extract all super-selection IDs that influence the query
  const {
    team: superSelectedTeamIds,
    season: superSelectedSeasonIds,
    meet: superSelectedMeetIds,
    athlete: superSelectedAthleteIds,
    person: superSelectedPersonIds,
    // event: superSelectedEventIds, // Add if filtering by event later
  } = filterState.superSelected;

  // The query key MUST include all dependencies passed to the fetch function
  // so React Query refetches when any of these selections change.
  const queryKey = [
    'results', // Base key for this query type
    superSelectedTeamIds,
    superSelectedSeasonIds,
    superSelectedMeetIds,
    superSelectedAthleteIds,
    superSelectedPersonIds,
    // superSelectedEventIds,
  ];

  return useQuery<ResultWithContextInfo[], Error>({
    queryKey: queryKey,
    queryFn: () =>
      fetchResultsWithContext(
        superSelectedTeamIds,
        superSelectedSeasonIds,
        superSelectedMeetIds,
        superSelectedAthleteIds,
        superSelectedPersonIds
        // superSelectedEventIds
      ),
    // Query is always enabled; filtering logic is handled inside fetchResultsWithContext
    enabled: true,
    // Optional: Configure staleTime and gcTime (formerly cacheTime)
    // staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    // gcTime: 30 * 60 * 1000, // Data is kept in cache for 30 minutes after inactive
  });
}
