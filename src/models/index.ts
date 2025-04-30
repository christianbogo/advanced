import { Timestamp } from 'firebase/firestore';

export interface Person {
  id: string;
  firstName: string;
  preferredName: string;
  lastName: string;
  birthday: string; // 'YYYY-MM-DD'
  gender: 'M' | 'F' | 'O';

  phone: string;
  emails: string[];

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Athlete {
  id: string;
  person: string; // references personId
  team: string; // references teamId
  season: string; // references seasonId

  grade: string | null;
  group: string | null;
  subgroup: string | null;
  lane: string | null;

  contactsCount?: number; // Count of contacts for the athlete
  resultsCount?: number; // Count of results for the athlete

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Contact {
  id: string;
  contact: string; // references personId
  relationship: string;
  recipient: string; // references personId
  isEmergency: boolean;
  recievesEmail: boolean;
}

export interface Team {
  id: string;
  type: string; // 'Club' | 'Masters' | 'High School' | 'Middle School'

  code: string;
  nameShort: string;
  nameLong: string;

  location: string;
  address: string;

  seasonCount?: number;
  latestSeasonId?: string; // Store ID of the latest season
  latestSeasonYear?: string; // Store name of the latest season
  latestSeasonAthletesCount?: number; // Count of athletes in the *latest* season
  meetCount?: number;
  resultsCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Season {
  id: string;
  team: string; // references teamId
  year: string; // 'YYYY' | 'YYYY-YYYY' (for multi-year seasons)
  nameLong: string;
  nameShort: string;

  startDate: string;
  endDate: string;

  dataComplete: boolean;

  meetCount?: number;
  athletesCount?: number; // Count of athletes in the *latest* season
  resultsCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Meet {
  id: string;
  nameShort: string;
  nameLong: string;

  date: string; // 'YYYY-MM-DD'
  location: string;
  address: string;

  team: string; // references teamId
  season: string; // references seasonId
  eventOrder: string[]; // references eventId

  official: boolean; // true if the meet is official
  benchmarks: boolean; // true if the meet is a benchmark setting meet

  dataComplete: boolean;

  eventsCount?: number; // Count of events in the meet
  athletesCount?: number; // Count of athletes in the meet
  resultsCount?: number; // Count of results in the meet

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Event {
  id: string;
  code: string;
  nameShort: string;
  nameLong: string;

  course: string;
  distance: number;
  stroke: string;

  hs: boolean; // high school event
  ms: boolean; // middle school event
  U14: boolean; // club under 14 event
  O15: boolean; // club over 15 event

  resultCount?: number; // Count of results in the event

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Result {
  id: string;

  team: string; // references teamId determined by the athlete's team
  season: string; // references seasonId determined by the athlete's season
  meet: string; // references meetId
  event: string; // references eventId
  athletes: string[]; // references athleteId

  ages: number[]; // calculated by determining the athlete's age at the time of the meet
  result: number;
  dq: boolean;
  official: boolean; // true if the meet is official
  benchmarks: boolean; // true if the meet is a benchmark setting meet

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Imports {
  id: string;
  person: string; // references personId
  event: string; // references eventId
  result: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
