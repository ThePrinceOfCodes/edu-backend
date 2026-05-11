import mongoose from 'mongoose';
import config from './src/config/config';
import User from './src/modules/users/user.model';
import { queryStudents } from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);
  const user = await User.findOne({ email: 'princejason109+2@gmail.com' });
  if (!user) throw new Error('user not found');

  const result = await queryStudents({}, { page: 1, limit: 5000 }, user as any);
  const bySchool = new Map<string, number>();

  for (const s of result.results as any[]) {
    const school = s.currentEnrollment?.school || s.school || 'NONE';
    bySchool.set(school, (bySchool.get(school) || 0) + 1);
  }

  console.log('TOTAL_VISIBLE', result.totalResults);
  console.log('BY_SCHOOL', JSON.stringify(Array.from(bySchool.entries()).sort((a, b) => b[1] - a[1]), null, 2));

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
