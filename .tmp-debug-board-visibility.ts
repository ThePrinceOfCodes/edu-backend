import mongoose from 'mongoose';
import config from './src/config/config';
import User from './src/modules/users/user.model';
import School from './src/modules/school/school.model';
import StudentEnrollment from './src/modules/student/studentEnrollment.model';
import { queryStudents } from './src/modules/student/student.service';

async function run() {
  await mongoose.connect(config.mongoose.url);

  const email = 'princejason109+2@gmail.com';
  const schoolIds = [
    '2457861c-e599-4a3a-b0c2-03945397fc84',
    '119f4192-63b8-4c25-b026-b68f55ea94cf',
    '52d8637c-69aa-46b1-88e3-cd30bbff1fd5',
  ];

  const user = await User.findOne({ email }).lean();
  console.log('USER', JSON.stringify(user ? {
    id: user._id,
    email: user.email,
    role: user.role,
    accountType: user.accountType,
    schoolBoardId: user.schoolBoardId,
    schoolId: user.schoolId,
    status: user.status,
  } : null, null, 2));

  for (const schoolId of schoolIds) {
    const school = await School.findById(schoolId).lean();
    const currentEnrollments = await StudentEnrollment.countDocuments({ school: schoolId, isCurrent: true });
    const anyEnrollments = await StudentEnrollment.countDocuments({ school: schoolId });
    const boardMatchCount = user?.schoolBoardId
      ? await StudentEnrollment.countDocuments({ school: schoolId, isCurrent: true, schoolBoard: user.schoolBoardId })
      : 0;
    const nullBoardCount = await StudentEnrollment.countDocuments({ school: schoolId, isCurrent: true, schoolBoard: null });

    let totalResults = -1;
    let error: string | null = null;
    if (user) {
      try {
        const result = await queryStudents({ school: schoolId }, { page: 1, limit: 10 }, user as any);
        totalResults = result.totalResults;
      } catch (e: any) {
        error = e?.message || 'unknown';
      }
    }

    console.log('SCHOOL', JSON.stringify({
      schoolId,
      schoolFound: Boolean(school),
      schoolBoard: (school as any)?.schoolBoard ?? null,
      currentEnrollments,
      anyEnrollments,
      currentEnrollmentBoardMatchCount: boardMatchCount,
      currentEnrollmentNullBoardCount: nullBoardCount,
      queryStudentsTotalResults: totalResults,
      queryStudentsError: error,
    }, null, 2));
  }

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
