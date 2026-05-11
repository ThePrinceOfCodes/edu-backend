import mongoose from 'mongoose';
import config from './src/config/config';
import { queryStudents } from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);

  const actor = {
    accountType: 'client',
    role: 'school-board-admin',
    schoolBoardId: '005e80a5-99e6-47fc-a18b-951ff6232e1a',
    schoolId: null,
  } as any;

  const result = await queryStudents(
    { school: '52d8637c-69aa-46b1-88e3-cd30bbff1fd5' },
    { page: 1, limit: 10 },
    actor
  );

  console.log(JSON.stringify({ totalResults: result.totalResults, pageCount: result.results.length }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
