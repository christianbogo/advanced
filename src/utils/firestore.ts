import {
  collection,
  query,
  where,
  getDocs,
  documentId,
  FirestoreError,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * Fetches multiple documents from a Firestore collection by an array of IDs,
 * automatically handling Firestore's 'in' query limit by fetching in chunks.
 *
 * @template T The expected type of the document data. The returned objects will
 * include an 'id' property populated from the document's ID.
 * @param ids An array of document IDs to fetch.
 * @param collectionName The name of the Firestore collection to query.
 * @returns A Promise that resolves to a Map where keys are document IDs
 * and values are the corresponding document data (as Partial<T> with 'id' included).
 * Returns a map of successfully fetched documents; may be partial if some chunks fail.
 */
export async function fetchChunkedData<T>(
  ids: string[],
  collectionName: string
): Promise<Map<string, Partial<T> & { id: string }>> {
  const dataMap = new Map<string, Partial<T> & { id: string }>();

  const uniqueValidIds = Array.from(new Set(ids)).filter(
    (id) => typeof id === 'string' && id.trim() !== ''
  );

  if (uniqueValidIds.length === 0) {
    return dataMap;
  }

  for (let i = 0; i < uniqueValidIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunkIds = uniqueValidIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);

    try {
      const chunkQuery = query(
        collection(db, collectionName),
        where(documentId(), 'in', chunkIds)
      );
      const snapshot = await getDocs(chunkQuery);

      snapshot.docs.forEach((doc) => {
        dataMap.set(doc.id, { ...(doc.data() as Partial<T>), id: doc.id });
      });
    } catch (error) {}
  }

  return dataMap;
}
