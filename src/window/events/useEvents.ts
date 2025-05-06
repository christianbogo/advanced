// src/window/events/useEvents.ts

import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Event } from '../../models/index'; // Adjust path as needed

/**
 * Fetches all events from the Firestore 'events' collection.
 * Applies sorting based on stroke (asc), distance (asc), and resultCount (desc).
 * @returns Promise<Event[]> - A promise that resolves to an array of Event objects.
 */
const fetchEvents = async (): Promise<Event[]> => {
  console.log('>>> fetchEvents function is running <<<'); // Add this line

  // Query the 'events' collection
  const eventsQuery = query(
    collection(db, 'events'),
    orderBy('stroke', 'asc'), // Primary sort: stroke alphabetical (A-Z)
    orderBy('distance', 'asc') // Secondary sort: distance (smallest to largest)
  );

  const querySnapshot = await getDocs(eventsQuery);

  // Map the documents to the Event interface, including the document ID
  const events = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Event, 'id'>), // Cast data, assuming it matches Event interface minus id
  }));

  return events;
};

/**
 * Custom hook to fetch events data using React Query.
 * Handles fetching, caching, loading, and error states.
 * Applies default sorting: stroke (asc), distance (asc), resultCount (desc).
 */
export function useEvents() {
  return useQuery<Event[], Error>({
    // Specify return type (Event array) and error type
    queryKey: ['events'], // Unique key for React Query caching
    queryFn: fetchEvents, // The function that performs the actual data fetching
    // Optional: Configure staleTime, cacheTime, etc. if needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}
