import { Timestamp } from 'firebase/firestore';

export interface Team {
  id: string;

  code: string;
  nameShort: string;
  nameLong: string;
  type: 'Club' | 'Masters' | 'High School' | 'Middle School' | 'Other';
  location: string;
  address: string;

  seasonCount?: number;
  meetCount?: number;
  resultsCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Season {
  id: string;

  team: Team;

  startDate: string;
  endDate: string;
  quarter: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  year: string;
  dataComplete: boolean;

  meetCount?: number;
  athletesCount?: number;
  resultsCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Meet {
  id: string;

  team: Team;
  season: Season;

  nameShort: string;
  nameLong: string;
  date: string;
  location: string;
  address: string;
  eventOrder: string[];
  official: boolean;
  benchmarks: boolean;
  dataComplete: boolean;

  eventsCount?: number;
  athletesCount?: number;
  resultsCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Athlete {
  id: string;

  team: Team;
  season: Season;
  person: Person;

  grade: string | null;
  group: string | null;
  subgroup: string | null;
  lane: string | null;

  contactsCount?: number;
  resultsCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Person {
  id: string;

  firstName: string;
  preferredName: string;
  lastName: string;
  birthday: string;
  gender: 'M' | 'F' | 'O';
  phone: string;
  emails: string[];

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Contact {
  id: string;

  contact: Person;
  recipient: Person;

  relationship: 'Father' | 'Mother' | 'Other';
  emergencyContact: boolean;
  emailRecipient: boolean;

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
  hs: boolean;
  ms: boolean;
  U14: boolean;
  O15: boolean;

  resultCount?: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Result {
  id: string;

  team: Team;
  season: Season;
  meet: Meet;
  event: Event;
  athletes: Athlete[];

  result: number;
  dq: boolean;
  isOfficial: boolean;
  isBenchmark: boolean;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Imports {
  id: string;

  team?: Team;
  season?: Season;
  meet?: Meet;
  athlete?: Athlete;
  event: Event;
  person: Person;

  result: number;
  date?: string;
  year?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
