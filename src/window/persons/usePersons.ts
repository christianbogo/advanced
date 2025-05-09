import { useQuery } from '@tanstack/react-query';
import {
  collection,
  query,
  getDocs,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Person } from '../../types/data';

const fetchPeople = async (): Promise<Person[]> => {
  const peopleQueryConstraints: QueryConstraint[] = [
    orderBy('lastName', 'asc'),
    orderBy('firstName', 'asc'),
  ];

  const peopleCollectionRef = collection(db, 'people');
  const peopleQueryInstance = query(
    peopleCollectionRef,
    ...peopleQueryConstraints
  );

  const peopleSnapshot = await getDocs(peopleQueryInstance);
  const people: Person[] = peopleSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Person, 'id'>),
  }));

  return people;
};

export function usePeople() {
  return useQuery<Person[], Error>({
    queryKey: ['people'],
    queryFn: fetchPeople,
  });
}
