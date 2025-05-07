import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase'; // Adjust path as needed
import { Team } from '../../models/index'; // Adjust path as needed

/**
 * Fetches all teams from the Firestore 'teams' collection.
 * @returns Promise<Team[]> - A promise that resolves to an array of Team objects.
 */
const fetchTeams = async (): Promise<Team[]> => {
  const teamsQuery = query(collection(db, 'teams'), orderBy('code'));
  const querySnapshot = await getDocs(teamsQuery);

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
    queryKey: ['teams'],
    queryFn: fetchTeams,
    // Optional: Configure staleTime, cacheTime, etc. here if needed
    // For example:
    // staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    // cacheTime: 15 * 60 * 1000, // Data is kept in cache for 15 minutes
  });
}
