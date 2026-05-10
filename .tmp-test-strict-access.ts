import mongoose from 'mongoose';
import httpStatus from 'http-status';
import config from './src/config/config';
import { queryStudents } from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);

  const ownSchoolActor = {
    accountType: 'client',
    role: 'school-admin',
    schoolId: '52d8637c-69aa-46b1-88e3-cd30bbff1fd5',
    schoolBoardId: '005e80a5-99e6-47fc-a18b-951ff6232e1a',
  } as any;

  const otherSchoolActor = {
    accountType: 'client',
    role: 'school-admin',
    schoolId: 'different-school-id',
    schoolBoardId: '005e80a5-99e6-47fc-a18b-951ff6232e1a',
  } as any;

  try {
    const ownResult = await queryStudents(
      { school: '52d8637c-69aa-46b1-88e3-cd30bbff1fd5' },
      { page: 1, limit: 10 },
      ownSchoolActor
    );
    console.log('✓ Own school query succeeded:', ownResult.totalResults, 'students');
  } catch (err: any) {
    console.log('✗ Own school query failed:', err.message);
  }

  try {
    const otherResult = await queryStudents(
      { school: '52d8637c-69aa-46b1-88e3-cd30bbff1fd5' },
      { page: 1, limit: 10 },
      otherSchoolActor
    );
    console.log('✗ Other school query should have failed but got:', otherResult.totalResults);
  } catch (err: any) {
    console.log('✓ Other school query correctly rejected:', err.message);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Fatal error:', error);
  await mongoose.disconnect();
  process.exit(1);
});
