import './utils/firebaseAdmin';

import * as seasonTriggers from './triggers/seasons';

export const seasonCreatedTeamCount =
  seasonTriggers.onSeasonCreatedUpdateTeamCount;
export const seasonDeletedTeamCount =
  seasonTriggers.onSeasonDeletedUpdateTeamCount;
