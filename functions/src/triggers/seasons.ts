import {
  onDocumentCreated,
  onDocumentDeleted,
  FirestoreEvent,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { db, admin } from '../utils/firebaseAdmin';

interface SeasonData {
  team?: string;
  year?: string;
  endDate?: string;
}

export const onSeasonCreatedUpdateTeamCount = onDocumentCreated(
  'seasons/{seasonId}',
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    if (!event.data) {
      logger.warn('Event data is missing for season creation.');
      return;
    }

    const seasonSnap = event.data;
    const seasonData = seasonSnap.data() as SeasonData;
    const seasonId = seasonSnap.id;

    if (
      !seasonData?.team ||
      typeof seasonData.team !== 'string' ||
      seasonData.team === ''
    ) {
      logger.error(`New season ${seasonId} is missing a valid team ID.`);
      return;
    }
    const teamId = seasonData.team;
    const teamRef = db.collection('teams').doc(teamId);

    logger.info(
      `Season ${seasonId} created for team ${teamId}. Incrementing count.`
    );

    try {
      await teamRef.update({
        seasonCount: admin.firestore.FieldValue.increment(1),
      });
      logger.info(`Incremented seasonCount for team ${teamId}`);
    } catch (error) {
      logger.error(
        `Failed to increment seasonCount for team ${teamId}:`,
        error
      );
    }
  }
);

export const onSeasonDeletedUpdateTeamCount = onDocumentDeleted(
  'seasons/{seasonId}',
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    if (!event.data) {
      logger.warn(
        'Event data (snapshot before delete) is missing for season deletion.'
      );
      return;
    }
    const deletedSeasonSnap = event.data;
    const deletedSeasonData = deletedSeasonSnap.data() as SeasonData;
    const seasonId = deletedSeasonSnap.id;

    if (
      !deletedSeasonData?.team ||
      typeof deletedSeasonData.team !== 'string' ||
      deletedSeasonData.team === ''
    ) {
      logger.warn(`Deleted ${seasonId} was missing ID. Cannot decrement.`);
      return;
    }
    const teamId = deletedSeasonData.team;
    const teamRef = db.collection('teams').doc(teamId);

    logger.info(
      `Season ${seasonId} deleted for team ${teamId}. Decrementing count.`
    );

    try {
      await teamRef.update({
        seasonCount: admin.firestore.FieldValue.increment(-1),
      });
      logger.info(`Decremented seasonCount for team ${teamId}`);
    } catch (error: unknown) {
      let errorCode: number | undefined = undefined;
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const errorCodeStr = (error as { code: string }).code;
        errorCode = parseInt(errorCodeStr, 10);
      }

      if (errorCode === 5) {
        logger.warn(`Team document ${teamId} not found.`);
      } else {
        logger.error(
          `Failed to decrement seasonCount for team ${teamId}:`,
          error
        );
      }
    }
  }
);
