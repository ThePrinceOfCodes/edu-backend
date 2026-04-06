import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../modules/logger/logger';
import { SchoolType } from '../modules/school-type';
import { ClassModel } from '../modules/class';

type ClassSeedRecord = {
  schoolTypeName: string;
  name: string;
  code: string;
};

const CLASS_SEED_DATA: ClassSeedRecord[] = [
  { schoolTypeName: 'Nursery', name: 'Creche', code: 'CRE' },
  { schoolTypeName: 'Nursery', name: 'KG 1', code: 'KG1' },
  { schoolTypeName: 'Nursery', name: 'KG 2', code: 'KG2' },

  { schoolTypeName: 'Primary', name: 'Primary 1', code: 'P1' },
  { schoolTypeName: 'Primary', name: 'Primary 2', code: 'P2' },
  { schoolTypeName: 'Primary', name: 'Primary 3', code: 'P3' },
  { schoolTypeName: 'Primary', name: 'Primary 4', code: 'P4' },
  { schoolTypeName: 'Primary', name: 'Primary 5', code: 'P5' },
  { schoolTypeName: 'Primary', name: 'Primary 6', code: 'P6' },

  {
    schoolTypeName: 'Junior Secondary',
    name: 'JSS 1',
    code: 'JSS1',
  },
  {
    schoolTypeName: 'Junior Secondary',
    name: 'JSS 2',
    code: 'JSS2',
  },
  {
    schoolTypeName: 'Junior Secondary',
    name: 'JSS 3',
    code: 'JSS3',
  },

  {
    schoolTypeName: 'Senior Secondary',
    name: 'SS 1',
    code: 'SS1',
  },
  {
    schoolTypeName: 'Senior Secondary',
    name: 'SS 2',
    code: 'SS2',
  },
  {
    schoolTypeName: 'Senior Secondary',
    name: 'SS 3',
    code: 'SS3',
  },
];

const run = async () => {
  try {
    await mongoose.connect(config.mongoose.url);
    logger.info('Connected to MongoDB for class seed');

    const schoolTypes = await SchoolType.find({
      name: { $in: ['Nursery', 'Primary', 'Junior Secondary', 'Senior Secondary'] },
    });

    const schoolTypeMap = new Map(schoolTypes.map((item) => [item.name, item.id]));

    for (const record of CLASS_SEED_DATA) {
      const schoolTypeId = schoolTypeMap.get(record.schoolTypeName);

      if (!schoolTypeId) {
        throw new Error(`Missing school type: ${record.schoolTypeName}. Run seed:school-types first.`);
      }

      await ClassModel.findOneAndUpdate(
        { schoolTypeId, code: record.code },
        {
          $set: {
            name: record.name,
            code: record.code,
            schoolTypeId,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    logger.info('Classes seeded successfully');
  } finally {
    await mongoose.disconnect();
  }
};

run()
  .then(() => {
    logger.info('Class seed completed');
    process.exit(0);
  })
  .catch((error: Error) => {
    logger.error(error.message);
    process.exit(1);
  });
