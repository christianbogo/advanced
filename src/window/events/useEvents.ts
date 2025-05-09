import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Event } from '../../types/data';

const fetchEvents = async (): Promise<Event[]> => {
  const eventsQuery = query(
    collection(db, 'events'),
    orderBy('stroke', 'asc'),
    orderBy('distance', 'asc')
  );

  const querySnapshot = await getDocs(eventsQuery);

  const events: Event[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Event, 'id'>),
  }));

  return events;
};

export function useEvents() {
  return useQuery<Event[], Error>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });
}
