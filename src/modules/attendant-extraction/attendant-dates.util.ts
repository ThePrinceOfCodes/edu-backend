/**
 * Returns every Monday–Friday working day (no weekends) between startDate and
 * endDate, inclusive, ordered chronologically.
 *
 * These are then used to map an attendance register's columns
 * (M T W Th F | M T W Th F | …) to real calendar dates.
 */
export const getWorkingDays = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const cursor = new Date(startDate);

  // Normalise to midnight UTC so comparisons are safe across DST boundaries
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    const dow = cursor.getUTCDay(); // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
};

/**
 * Given an ordered list of working days and a flat array of status marks
 * extracted from a single student row, returns an array of (date, mark) pairs.
 *
 * The register lays out marks left-to-right: week 1 Mon…Fri, then week 2
 * Mon…Fri, etc.  Mark index i therefore maps directly to workingDays[i].
 */
export const zipMarksToWorkingDays = (
  workingDays: Date[],
  statusMarks: string[],
): Array<{ date: Date; rawMark: string }> => {
  return statusMarks
    .map((rawMark, i) => (workingDays[i] ? { date: workingDays[i]!, rawMark } : null))
    .filter((entry): entry is { date: Date; rawMark: string } => entry !== null);
};
