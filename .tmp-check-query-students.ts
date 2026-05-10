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

  const schoolId = '52d8637c-69aa-46b1-88e3-cd30bbff1fd5';

  const noSession = await queryStudents({ school: schoolId }, { page: 1, limit: 10 }, actor);
  const withCurrentSession = await queryStudents({ school: schoolId, academicSessionId: 'be19cde7-0f84-45d3-8a7c-4b91f0d8aeae' }, { page: 1, limit: 10 }, actor);
  const withOldSession = await queryStudents({ school: schoolId, academicSessionId: '727b7541-a527-4f0a-82d8-f3c4c4856d55' }, { page: 1, limit: 10 }, actor);
  const withUnknownSession = await queryStudents({ school: schoolId, academicSessionId: '00000000-0000-0000-0000-000000000000' }, { page: 1, limit: 10 }, actor);

  console.log(JSON.stringify({
    noSession: noSession.totalResults,
    withCurrentSession: withCurrentSession.totalResults,
    withOldSession: withOldSession.totalResults,
    withUnknownSession: withUnknownSession.totalResults,
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
