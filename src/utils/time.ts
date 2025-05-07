export const timeStringToHundredths = (
  timeString: string | null | undefined
): number | null => {
  if (timeString === null || timeString === undefined) {
    return null;
  }

  let trimmedTime = String(timeString).trim();
  if (!trimmedTime) {
    return null;
  }

  let minutes = 0;
  let seconds = 0;
  let hundredths = 0;
  let timeParts: string[];

  if (trimmedTime.includes(':')) {
    timeParts = trimmedTime.split(':');
    if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) {
      return null;
    }

    const minutePart = parseInt(timeParts[0], 10);
    if (isNaN(minutePart) || minutePart < 0) {
      return null;
    }
    minutes = minutePart;
    trimmedTime = timeParts[1];
  } else {
    timeParts = [trimmedTime];
  }

  const secondsPartString = trimmedTime;
  if (secondsPartString.includes('.')) {
    const secParts = secondsPartString.split('.');
    if (secParts.length !== 2 || !secParts[0]) {
      return null;
    }

    const secIntPart = parseInt(secParts[0], 10);
    if (isNaN(secIntPart) || secIntPart < 0 || secIntPart >= 60) {
      return null;
    }
    seconds = secIntPart;

    let hundredthsStr = secParts[1].padEnd(2, '0').substring(0, 2);
    const hundredthsPart = parseInt(hundredthsStr, 10);

    if (isNaN(hundredthsPart) || hundredthsPart < 0 || hundredthsPart > 99) {
      return null;
    }
    hundredths = hundredthsPart;
  } else {
    const secIntPart = parseInt(secondsPartString, 10);
    if (isNaN(secIntPart) || secIntPart < 0 || secIntPart >= 60) {
      return null;
    }
    seconds = secIntPart;
    hundredths = 0;
  }

  return minutes * 60 * 100 + seconds * 100 + hundredths;
};

export const hundredthsToTimeString = (
  totalHundredths: number | null | undefined
): string => {
  if (
    totalHundredths === null ||
    totalHundredths === undefined ||
    isNaN(totalHundredths) ||
    totalHundredths < 0
  ) {
    return '--';
  }

  const totalSeconds = Math.floor(totalHundredths / 100);
  const hundredths = Math.floor(totalHundredths % 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = String(seconds).padStart(2, '0');
  const paddedHundredths = String(hundredths).padStart(2, '0');

  if (minutes > 0) {
    return `${minutes}:${paddedSeconds}.${paddedHundredths}`;
  } else {
    return `${seconds}.${paddedHundredths}`;
  }
};
