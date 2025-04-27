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
  team: string; // references teamId
  season: string; // references seasonId
  person: string; // references personId

  grade: string | null;
  group: string | null;
  subgroup: string | null;
  lane: string | null;

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
  type: string;

  code: string;
  nameShort: string;
  nameLong: string;

  currentSeason?: string;

  location: string;
  address: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Season {
  id: string;
  team: string; // references teamId
  nameLong: string;
  nameShort: string;

  startDate: string;
  endDate: string;

  isComplete: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Meet {
  id: string;
  nameLong: string;
  nameShort: string;
  date: string; // 'YYYY-MM-DD'

  locationName: string;
  locationAddress: string; // Address as string

  team: string; // references teamId
  season: string; // references seasonId
  eventOrder: string[]; // references eventId

  official: boolean; // true if the meet is official
  benchmarks: boolean; // true if the meet is a benchmark setting meet

  isComplete: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Event {
  id: string;
  code: string;
  nameLong: string;
  nameShort: string;
  course: string;
  distance: number;
  stroke: string;
  hs: boolean; // high school event
  ms: boolean; // middle school event
  U14: boolean; // club under 14 event
  O15: boolean; // club over 15 event
}

export interface IndividualResult {
  id: string;

  meet: string; // references meetId
  event: string; // references eventId
  athlete: string; // references athleteId

  team: string; // references teamId determined by the athlete's team
  season: string; // references seasonId determined by the athlete's season
  age: number; // calculated by determining the athlete's age at the time of the meet

  result: number;
  dq: boolean;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RelayResult {
  id: string;

  meet: string; // references meetId
  event: string; // references eventId

  athletes: string[]; // references athleteId

  team: string; // references teamId determined by the athlete's team
  season: string; // references seasonId determined by the athlete's season

  result: number;
  dq: boolean;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
