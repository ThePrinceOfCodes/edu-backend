import mongoose from 'mongoose';
import config from './src/config/config';
import * as studentService from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);

  const actor = {
    accountType: 'internal',
    role: 'super-admin',
  } as any;

  const schoolId = '52d8637c-69aa-46b1-88e3-cd30bbff1fd5';
  const result = await studentService.queryStudents({ school: schoolId }, { limit: 200, page: 1 }, actor);

  console.log(JSON.stringify({
    totalResults: result.totalResults,
    resultsLength: result.results.length,
    firstFive: result.results.slice(0, 5).map((item: any) => ({
      regNumber: item.regNumber,
      school: item.school,
      currentEnrollment: item.currentEnrollment,
    })),
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
