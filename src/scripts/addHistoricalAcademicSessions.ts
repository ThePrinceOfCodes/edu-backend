import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config';
import logger from '../modules/logger/logger';
import SchoolBoard from '../modules/school-board/schoolBoard.model';
import AcademicSession from '../modules/academic-session/academicSession.model';

const run = async () => {
  try {
    await mongoose.connect(config.mongoose.url);
    logger.info('Connected to MongoDB');

    const schoolBoards = await SchoolBoard.find().lean();
    logger.info(`Found ${schoolBoards.length} school boards`);

    if (schoolBoards.length === 0) {
      logger.warn('No school boards found. Please create school boards first.');
      await mongoose.disconnect();
      return;
    }

    const currentYear = new Date().getUTCFullYear();
    const startYear = 2010;
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const schoolBoard of schoolBoards) {
      for (let year = startYear; year <= currentYear; year += 1) {
        const endYear = year + 1;
        const sessionName = `${year}/${endYear}`;

        const exists = await AcademicSession.findOne({
          schoolBoard: schoolBoard._id,
          startYear: year,
          endYear,
        });

        if (exists) {
          totalSkipped += 1;
          continue;
        }

        const now = new Date();
        const sessionStart = new Date(Date.UTC(year, 8, 1));
        const sessionEnd = new Date(Date.UTC(endYear, 7, 31, 23, 59, 59, 999));
        const isActive = sessionStart <= now && sessionEnd >= now;

        await AcademicSession.create({
          _id: uuidv4(),
          name: sessionName,
          startYear: year,
          endYear,
          schoolBoard: schoolBoard._id,
          isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        totalCreated += 1;
      }
    }

    logger.info(`✓ Migration complete: ${totalCreated} sessions created, ${totalSkipped} already existed`);
    await mongoose.disconnect();
  } catch (error) {
    logger.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
