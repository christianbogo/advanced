// functions/src/triggers/seasons.ts
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentWritten,
  FirestoreEvent,
  QueryDocumentSnapshot,
  Change, // Import Change for onDocumentWritten
} from "firebase-functions/v2/firestore"; // v2 Firestore triggers
// Removed unused import for getFirestore
import {logger} from "firebase-functions/v2"; // v2 logger

// Assuming you have this utility file as discussed previously:
import {db, admin} from "../utils/firebaseAdmin";
import {DocumentSnapshot} from "firebase-admin/firestore";

// Define the Season data structure for type safety within functions
interface SeasonData {
  team?: string;
  year?: string;
  endDate?: string;
  // Add other fields if needed by logic here
}

/**
 * Increments the seasonCount on the corresponding Team document
 * when a new Season document is created.
 */
export const onSeasonCreatedUpdateTeamCount = onDocumentCreated(
  "seasons/{seasonId}", // Path to listen to
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    if (!event.data) {
      logger.warn("Event data is missing for season creation.");
      return; // Should not happen for onCreate, but good practice
    }

    const seasonSnap = event.data;
    const seasonData = seasonSnap.data() as SeasonData; // Cast to known type
    const seasonId = seasonSnap.id;

    // Validate team ID
    if (
      !seasonData?.team ||
      typeof seasonData.team !== "string" ||
      seasonData.team === ""
    ) {
      logger.error(`New season ${seasonId} is missing a valid team ID.`);
      return;
    }
    const teamId = seasonData.team;
    const teamRef = db.collection("teams").doc(teamId);

    logger.info(
      `Season ${seasonId} created for team ${teamId}. Incrementing count.`
    );

    try {
      // Use FieldValue.increment for atomic & safe counter updates
      await teamRef.update({
        seasonCount: admin.firestore.FieldValue.increment(1),
      });
      logger.info(`Incremented seasonCount for team ${teamId}`);
    } catch (error) {
      logger.error(
        `Failed to increment seasonCount for team ${teamId}:`,
        error
      );
      // Consider adding more robust error handling/retry if needed
    }
  }
);

/**
 * Decrements the seasonCount on the corresponding Team document
 * when a Season document is deleted.
 */
export const onSeasonDeletedUpdateTeamCount = onDocumentDeleted(
  "seasons/{seasonId}", // Path to listen to
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    if (!event.data) {
      logger.warn(
        "Event data (snapshot before delete) is missing for season deletion."
      );
      return; // Should not happen for onDelete, but good practice
    }
    const deletedSeasonSnap = event.data; // Data *before* deletion
    const deletedSeasonData = deletedSeasonSnap.data() as SeasonData;
    const seasonId = deletedSeasonSnap.id;

    // Validate team ID from the *deleted* document's data
    if (
      !deletedSeasonData?.team ||
      typeof deletedSeasonData.team !== "string" ||
      deletedSeasonData.team === ""
    ) {
      logger.warn(
        `Deleted season ${seasonId} was missing a valid team ID. Cannot decrement count.`
      );
      return;
    }
    const teamId = deletedSeasonData.team;
    const teamRef = db.collection("teams").doc(teamId);

    logger.info(
      `Season ${seasonId} deleted for team ${teamId}. Decrementing count.`
    );

    try {
      // Use FieldValue.increment for atomic & safe counter updates
      await teamRef.update({
        seasonCount: admin.firestore.FieldValue.increment(-1),
      });
      logger.info(`Decremented seasonCount for team ${teamId}`);
    } catch (error: any) {
      // Check if the error is because the team document itself doesn't exist
      if (error.code === 5) {
        // Firestore error code for NOT_FOUND
        logger.warn(
          `Team document ${teamId} not found when trying to decrement seasonCount.`
        );
      } else {
        logger.error(
          `Failed to decrement seasonCount for team ${teamId}:`,
          error
        );
      }
      // Consider adding more robust error handling/retry if needed
    }
  }
);

/**
 * Updates the latestSeasonId and latestSeasonYear on the corresponding Team document
 * whenever a Season document is created, updated, or deleted.
 */
export const onSeasonWrittenUpdateTeamLatest = onDocumentWritten(
  "seasons/{seasonId}", // Path to listen to (catches create, update, delete)
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    if (!event.data) {
      logger.warn("Event data (change object) is missing for season write.");
      return; // Should not happen for onWritten, but good practice
    }

    const change = event.data; // Contains change.before and change.after snapshots
    const seasonId = event.params.seasonId; // Get wildcard value from context

    // Determine the teamId: Prioritize 'after' data (create/update), fallback to 'before' (delete)
    const beforeData = change.before?.data() as SeasonData | undefined;
    const afterData = change.after?.data() as SeasonData | undefined;
    const teamId = afterData?.team ?? beforeData?.team; // Get teamId from after if it exists, else from before

    // Validate team ID
    if (!teamId || typeof teamId !== "string" || teamId === "") {
      logger.warn(
        `Season write event for ${seasonId} occurred without a valid team ID in before or after data.`
      );
      return;
    }

    // Optional: Check if relevant fields changed to avoid unnecessary recalculations on some updates
    // if (change.before.exists && change.after.exists) {
    //   if (beforeData?.endDate === afterData?.endDate && beforeData?.year === afterData?.year && beforeData?.team === afterData?.team) {
    //     logger.info(`Season ${seasonId} updated, but relevant fields (endDate, year, team) did not change. Skipping latest season recalculation.`);
    //     return;
    //   }
    // }

    logger.info(
      `Season ${seasonId} written for team ${teamId}. Recalculating latest season info.`
    );
    const teamRef = db.collection("teams").doc(teamId);

    try {
      // Query for the current latest season for this team
      const latestSeasonQuery = db
        .collection("seasons")
        .where("team", "==", teamId)
        .orderBy("endDate", "desc") // Order by end date to find the latest
        .limit(1);

      const querySnapshot = await latestSeasonQuery.get();

      let latestSeasonId: string | null = null;
      let latestSeasonYear: string | null = null;

      if (!querySnapshot.empty) {
        // We found a latest season
        const latestSeasonDoc = querySnapshot.docs[0];
        latestSeasonId = latestSeasonDoc.id;
        latestSeasonYear = (latestSeasonDoc.data() as SeasonData)?.year ?? null; // Extract year
        logger.info(
          `Found latest season ${latestSeasonId} (${latestSeasonYear}) for team ${teamId}`
        );
      } else {
        // No seasons found for this team (likely the deleted one was the last)
        logger.info(
          `No seasons found for team ${teamId}. Clearing latest season info.`
        );
      }

      // Update the team document with the latest info (or nulls if none found)
      await teamRef.update({
        latestSeasonId: latestSeasonId,
        latestSeasonYear: latestSeasonYear,
      });
      logger.info(`Updated latest season info on team ${teamId}.`);
    } catch (error) {
      logger.error(
        `Failed to recalculate/update latest season info for team ${teamId}:`,
        error
      );
    }
  }
);
