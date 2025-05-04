// src/hooks/useEvents.ts (or wherever you keep your data hooks)

import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Event } from '../../models/index'; // Adjust path as needed

/**
 * Fetches all events from the Firestore 'events' collection.
 * Sorts them logically for display (Distance ASC, Stroke ASC, Name ASC).
 * @returns Promise<Event[]> - A promise resolving to an array of Event objects.
 */
const fetchEvents = async (): Promise<Event[]> => {
  console.log('[fetchEvents] Fetching all events...');

  // Define the desired sort order
  const eventsQueryConstraints = [
    orderBy('distance', 'asc'), // Sort by distance first (e.g., 50, 100, 200...)
    orderBy('stroke', 'asc'), // Then by stroke alphabetically (Back, Breast, Fly, Free, IM)
    orderBy('nameShort', 'asc'), // Finally by short name alphabetically
  ];

  const eventsQuery = query(
    collection(db, 'events'),
    ...eventsQueryConstraints
  );

  try {
    const eventsSnapshot = await getDocs(eventsQuery);
    const events: Event[] = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Event, 'id'>),
    }));

    console.log(`[fetchEvents] Found ${events.length} events.`);
    return events;
  } catch (error) {
    console.error('[fetchEvents] Error fetching events:', error);
    // Re-throw the error so React Query can handle it
    throw new Error('Failed to fetch events.');
  }
};

/**
 * Custom hook to fetch all events data, sorted logically.
 */
export function useEvents() {
  return useQuery<Event[], Error>({
    // Query key for caching
    queryKey: ['events'],
    // Function to fetch the data
    queryFn: fetchEvents,
    // Optional: Set staleTime as events list might not change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Optional: cacheTime, refetchOnWindowFocus, etc. can be configured here
  });
}
