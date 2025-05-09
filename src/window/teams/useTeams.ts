import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Team } from '../../types/data';

const fetchTeams = async (): Promise<Team[]> => {
  const teamsCollectionRef = collection(db, 'teams');
  const teamsQuery = query(teamsCollectionRef, orderBy('code'));
  const querySnapshot = await getDocs(teamsQuery);

  const teams: Team[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Team, 'id'>),
  }));

  return teams;
};

export function useTeams() {
  return useQuery<Team[], Error>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });
}
