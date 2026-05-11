import mongoose from 'mongoose';
import config from './src/config/config';
import User from './src/modules/users/user.model';
import { querySchools } from './src/modules/school/school.service';
import { queryStudents } from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);

  const user = await User.findOne({ email: 'princejason109+2@gmail.com' });
  if (!user) throw new Error('User not found');

  const schools = await querySchools({}, { page: 1, limit: 500 }, user as any);
  console.log('SCHOOLS_TOTAL', schools.totalResults);
  console.log('SCHOOL_IDS', schools.results.map((s: any) => s.id));

  const targets = [
    '2457861c-e599-4a3a-b0c2-03945397fc84',
    '119f4192-63b8-4c25-b026-b68f55ea94cf',
    '52d8637c-69aa-46b1-88e3-cd30bbff1fd5',
  ];

  for (const school of targets) {
    const res = await queryStudents({ school }, { page: 1, limit: 20 }, user as any);
    console.log('STUDENTS', school, res.totalResults);
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
