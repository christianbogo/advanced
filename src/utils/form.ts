import { Timestamp } from 'firebase/firestore';

export const formatTimestamp = (
  timestamp: Timestamp | undefined | null
): string => {
  if (timestamp && timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return 'N/A';
};

export const boolToString = (value: boolean | undefined | null): string => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
};

export const stringToBool = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};
