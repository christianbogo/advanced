import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Team } from '../../models/index'; // Adjust path as needed

/**
 * Fetches all teams from the Firestore 'teams' collection.
 * @returns Promise<Team[]> - A promise that resolves to an array of Team objects.
 */
const fetchTeams = async (): Promise<Team[]> => {
  // Query the 'teams' collection, ordering by code for consistency
  const teamsQuery = query(collection(db, 'teams'), orderBy('code'));
  const querySnapshot = await getDocs(teamsQuery);

  // Map the documents to the Team interface, including the document ID
  const teams = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Team, 'id'>), // Cast data, assuming it matches Team interface minus id
  }));

  return teams;
};

/**
 * Custom hook to fetch teams data using React Query.
 * Handles fetching, caching, loading, and error states.
 */
export function useTeams() {
  return useQuery<Team[], Error>({
    // Specify return type (Team array) and error type
    queryKey: ['teams'], // Unique key for React Query caching
    queryFn: fetchTeams, // The function that performs the actual data fetching
    // Optional: Configure staleTime, cacheTime, etc. if needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 15 * 60 * 1000, // 15 minutes
  });
}
