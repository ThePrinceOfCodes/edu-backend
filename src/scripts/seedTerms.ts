import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../modules/logger/logger';
import SchoolBoard from '../modules/school-board/schoolBoard.model';
import Term from '../modules/term/term.model';

type TermSeedDefinition = {
  termName: 'First Term' | 'Second Term' | 'Third Term';
  startDate: Date;
  endDate: Date;
};

const toUtcDate = (year: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));

const getAcademicSessionStartYear = (referenceDate: Date) => {
  const month = referenceDate.getUTCMonth();
  const year = referenceDate.getUTCFullYear();
  return month >= 8 ? year : year - 1;
};

const buildAcademicSession = (startYear: number) => `${startYear}/${startYear + 1}`;

const buildTermName = (
  academicSession: string,
  termName: string,
  startDate: Date,
  endDate: Date
) => {
  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);
  return `${academicSession} ${termName} (${start} - ${end})`;
};

const buildTermDefinitions = (sessionStartYear: number): TermSeedDefinition[] => [
  {
    termName: 'First Term',
    startDate: toUtcDate(sessionStartYear, 8, 8),
    endDate: toUtcDate(sessionStartYear, 11, 19),
  },
  {
    termName: 'Second Term',
    startDate: toUtcDate(sessionStartYear + 1, 0, 12),
    endDate: toUtcDate(sessionStartYear + 1, 3, 10),
  },
  {
    termName: 'Third Term',
    startDate: toUtcDate(sessionStartYear + 1, 3, 27),
    endDate: toUtcDate(sessionStartYear + 1, 6, 24),
  },
];

const isDateWithinRange = (referenceDate: Date, startDate: Date, endDate: Date) =>
  referenceDate >= startDate && referenceDate <= endDate;

const run = async () => {
  const now = new Date();
  const sessionStartYear = getAcademicSessionStartYear(now);
  const academicSession = buildAcademicSession(sessionStartYear);
  const termDefinitions = buildTermDefinitions(sessionStartYear);

  let createdCount = 0;
  let updatedCount = 0;

  try {
    await mongoose.connect(config.mongoose.url);
    logger.info(`Connected to MongoDB for term seed (${academicSession})`);

    const schoolBoards = await SchoolBoard.find({ status: 'active' });
    if (!schoolBoards.length) {
      throw new Error('No active school boards found. Seed school boards before seeding terms.');
    }

    for (const schoolBoard of schoolBoards) {
      for (const definition of termDefinitions) {
        const isActive = isDateWithinRange(now, definition.startDate, definition.endDate);
        const name = buildTermName(academicSession, definition.termName, definition.startDate, definition.endDate);

        const existing = await Term.findOne({
          schoolBoard: schoolBoard.id,
          school: null,
          termName: definition.termName,
          academicSession,
        });

        if (existing) {
          existing.name = name;
          existing.startDate = definition.startDate;
          existing.endDate = definition.endDate;
          existing.isActive = isActive;
          await existing.save();
          updatedCount += 1;
        } else {
          await Term.create({
            name,
            termName: definition.termName,
            academicSession,
            schoolBoard: schoolBoard.id,
            school: null,
            startDate: definition.startDate,
            endDate: definition.endDate,
            isActive,
          });
          createdCount += 1;
        }
      }

      const activeTermNames = termDefinitions
        .filter((definition) => isDateWithinRange(now, definition.startDate, definition.endDate))
        .map((definition) => definition.termName);

      await Term.updateMany(
        {
          schoolBoard: schoolBoard.id,
          school: null,
          academicSession,
          termName: { $nin: activeTermNames },
          isActive: true,
        },
        { $set: { isActive: false } }
      );
    }

    logger.info(
      `Terms seeded successfully for ${schoolBoards.length} school boards. Created: ${createdCount}, updated: ${updatedCount}`
    );
  } finally {
    await mongoose.disconnect();
  }
};

run()
  .then(() => {
    logger.info('Term seed completed');
    process.exit(0);
  })
  .catch((error: Error) => {
    logger.error(error.message);
    process.exit(1);
  });
