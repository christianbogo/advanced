import {
  collection,
  query,
  where,
  getDocs,
  documentId,
  FirestoreError, // Import FirestoreError for better error typing
} from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path as needed

// Define the Firestore 'in' query limit (currently 30, but good to have as a constant)
const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * Fetches multiple documents from a Firestore collection based on an array of IDs,
 * handling Firestore's 'in' query limit by fetching in chunks.
 *
 * @template T The expected type of the document data (should have an 'id' property or be added).
 * @param {string[]} ids An array of document IDs to fetch.
 * @param {string} collectionName The name of the Firestore collection to query.
 * @returns {Promise<Map<string, Partial<T>>>} A promise that resolves to a Map where keys are document IDs
 * and values are the corresponding document data (as Partial<T>). Returns potentially partial
 * data if some chunks fail.
 */
export async function fetchChunkedData<T extends { id?: string }>(
  ids: string[],
  collectionName: string
): Promise<Map<string, Partial<T>>> {
  const dataMap = new Map<string, Partial<T>>();

  // Remove duplicates and filter out any potentially empty/null IDs
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);

  if (uniqueIds.length === 0) {
    // console.log(`[fetchChunkedData] No valid IDs provided for ${collectionName}, returning empty map.`);
    return dataMap; // Return empty map if no valid IDs
  }

  // console.log(`[fetchChunkedData] Fetching ${uniqueIds.length} unique IDs from ${collectionName} in chunks.`);

  // Process IDs in chunks respecting the Firestore limit
  for (let i = 0; i < uniqueIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunkIds = uniqueIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);

    if (chunkIds.length === 0) continue; // Should not happen with the loop logic, but safe check

    // console.log(`[fetchChunkedData] Fetching chunk ${i / FIRESTORE_IN_QUERY_LIMIT + 1} for ${collectionName} (IDs: ${chunkIds.length})`);

    try {
      // Construct the query for the current chunk
      const chunkQuery = query(
        collection(db, collectionName),
        where(documentId(), 'in', chunkIds)
      );

      // Execute the query
      const snapshot = await getDocs(chunkQuery);

      // Process the documents found in this chunk
      snapshot.docs.forEach((doc) => {
        // Store the data in the map, ensuring the ID is included
        // Cast data() to T, assuming it matches the structure
        dataMap.set(doc.id, { id: doc.id, ...doc.data() } as Partial<T>);
      });

      // Optional: Log if some IDs in the chunk weren't found
      // if (snapshot.docs.length < chunkIds.length) {
      //   const foundIds = new Set(snapshot.docs.map(d => d.id));
      //   const missingIds = chunkIds.filter(id => !foundIds.has(id));
      //   console.warn(`[fetchChunkedData] Could not find documents for IDs in ${collectionName}:`, missingIds);
      // }
    } catch (error) {
      // Log detailed error information
      const firestoreError = error as FirestoreError;
      console.error(
        `[fetchChunkedData] Error fetching chunk from ${collectionName}:`,
        {
          chunkIds: chunkIds,
          message: firestoreError.message,
          code: firestoreError.code, // Firestore error code is helpful
          stack: firestoreError.stack?.substring(0, 200) + '...', // Log part of the stack
        }
      );
      // Decide on error strategy:
      // 1. Continue to next chunk (current behavior): Returns potentially partial data.
      // 2. Throw the error: Stops the entire fetch process on the first chunk failure.
      // throw error; // Uncomment to make it fail fast
    }
  }

  // console.log(`[fetchChunkedData] Finished fetching for ${collectionName}. Found data for ${dataMap.size} IDs.`);
  return dataMap;
}
