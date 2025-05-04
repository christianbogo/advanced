// src/window/people/usePeople.ts

import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  getDocs,
  orderBy,
  QueryConstraint, // Keep for potential future use or consistency
} from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Person } from '../../models/index'; // Adjust path as needed
// No FilterContext needed here as we decided against server-side filtering for people

/**
 * Fetches all person documents from Firestore, ordered by last name, then first name.
 * This fetch function does NOT filter based on super-selected items
 * in the FilterContext, as People are often treated as a master list.
 *
 * @returns Promise<Person[]> - A promise resolving to an array of Person objects.
 */
const fetchPeople = async (): Promise<Person[]> => {
  console.log('[fetchPeople] Fetching all people.');

  // Define default sorting
  const peopleQueryConstraints: QueryConstraint[] = [
    orderBy('lastName', 'asc'),
    orderBy('firstName', 'asc'),
  ];

  // Use the confirmed collection name 'people'
  const peopleCollectionRef = collection(db, 'people');
  const peopleQuery = query(peopleCollectionRef, ...peopleQueryConstraints);

  try {
    const peopleSnapshot = await getDocs(peopleQuery);
    const people: Person[] = peopleSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Person, 'id'>), // Cast data, assuming it matches Person structure
    }));

    console.log(`[fetchPeople] Found ${people.length} people.`);
    return people;
  } catch (error) {
    console.error('[fetchPeople] Error fetching people:', error);
    // Rethrow the error so React Query can handle the error state
    throw error;
  }
};

/**
 * Custom hook to fetch people data using React Query.
 * Provides the list of all people, sorted alphabetically by last name, then first name.
 * It does not apply server-side filtering based on super-selections.
 */
export function usePeople() {
  // We don't need filterState here since fetchPeople doesn't use it.

  return useQuery<Person[], Error>({
    // Query key is simple as no dynamic server-side filters are applied.
    queryKey: ['people'],

    // The function that fetches the data.
    queryFn: fetchPeople,

    // Query is enabled by default.
    // enabled: true,

    // Optional: Configure how long data is considered fresh (e.g., 5 minutes).
    // staleTime: 5 * 60 * 1000,
  });
}
