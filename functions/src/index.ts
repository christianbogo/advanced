// functions/src/index.ts

// Ensure admin SDK is initialized by importing the utility file first.
// The import itself doesn't need to be assigned if you only need the side effect.
import "./utils/firebaseAdmin";

// Import functions from their specific files
import * as seasonTriggers from "./triggers/seasons";
// import * as meetTriggers from './triggers/meets';          // Keep for future use
// import * as athleteTriggers from './triggers/athletes';    // Keep for future use
// import * as resultTriggers from './triggers/results';      // Keep for future use

// --- Export Season Related Triggers ---
// Match the names exported from triggers/seasons.ts (v2 API)
// The name on the left is how the function will be named upon deployment
export const seasonCreatedTeamCount =
  seasonTriggers.onSeasonCreatedUpdateTeamCount;
export const seasonDeletedTeamCount =
  seasonTriggers.onSeasonDeletedUpdateTeamCount;
export const seasonWrittenTeamLatest =
  seasonTriggers.onSeasonWrittenUpdateTeamLatest;

// --- Export Meet Related Triggers ---
// (Placeholders - uncomment and adjust names when you implement meets.ts)
// export const meetCreatedTeamCount = meetTriggers.onMeetCreatedUpdateTeamCount;
// export const meetDeletedTeamCount = meetTriggers.onMeetDeletedUpdateTeamCount;
// export const meetWrittenSeasonCount = meetTriggers.onMeetWrittenUpdateSeasonCount; // If needed

// --- Export Athlete Related Triggers ---
// (Placeholders - uncomment and adjust names when you implement athletes.ts)
// export const athleteWrittenSeasonCount = athleteTriggers.onAthleteWrittenUpdateSeasonCount; // For Season.athletesCount
// export const athleteWrittenTeamLatestCount = athleteTriggers.onAthleteWrittenUpdateTeamLatestSeasonCount; // For Team.latestSeasonAthletesCount

// --- Export Result Related Triggers ---
// (Placeholders - uncomment and adjust names when you implement results.ts)
// export const resultCreatedTeamCount = resultTriggers.onResultCreatedUpdateTeamCount; // For Team.resultsCount
// export const resultDeletedTeamCount = resultTriggers.onResultDeletedUpdateTeamCount; // For Team.resultsCount
// export const resultCreatedSeasonCount = resultTriggers.onResultCreatedUpdateSeasonCount; // For Season.resultsCount (if needed)
// export const resultDeletedSeasonCount = resultTriggers.onResultDeletedUpdateSeasonCount; // For Season.resultsCount (if needed)

// --- Notes ---
// Using explicit re-exports (like above) is generally safer than barrel exports (`export * from ...`)
// as it prevents accidental naming collisions if different trigger files export functions
// with the same name (e.g., two files exporting a function named 'updateCount').
