import mongoose from 'mongoose';
import config from './src/config/config';
import { queryStudents } from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);

  const targetSchool = '52d8637c-69aa-46b1-88e3-cd30bbff1fd5';

  const matchingActor = {
    accountType: 'client',
    role: 'school-admin',
    schoolId: targetSchool,
    schoolBoardId: '005e80a5-99e6-47fc-a18b-951ff6232e1a',
  } as any;

  const otherActor = {
    accountType: 'client',
    role: 'school-admin',
    schoolId: 'some-other-school-id',
    schoolBoardId: '005e80a5-99e6-47fc-a18b-951ff6232e1a',
  } as any;

  const forMatching = await queryStudents({ school: targetSchool }, { page: 1, limit: 5 }, matchingActor);
  const forOther = await queryStudents({ school: targetSchool }, { page: 1, limit: 5 }, otherActor);

  console.log(JSON.stringify({
    forMatchingSchoolAdmin: forMatching.totalResults,
    forDifferentSchoolAdmin: forOther.totalResults,
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
