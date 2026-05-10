import mongoose from 'mongoose';
import config from '../config/config';
import logger from '../modules/logger/logger';
import SchoolBoard from '../modules/school-board/schoolBoard.model';
import SchoolType from '../modules/school-type/schoolType.model';
import ClassModel from '../modules/class/class.model';
import School from '../modules/school/school.model';
import Student from '../modules/student/student.model';
import StudentEnrollment from '../modules/student/studentEnrollment.model';
import Attendance from '../modules/attendance/attendance.model';
import AcademicSession from '../modules/academic-session/academicSession.model';
import Term from '../modules/term/term.model';

const START_DATE = new Date(Date.UTC(2024, 0, 1));
const TODAY = new Date();

const FIRST_NAMES = [
  'Amina', 'Chinedu', 'Fatima', 'David', 'Grace', 'Musa', 'Esther', 'Samuel', 'Zainab', 'Daniel',
  'Mercy', 'Ibrahim', 'Joy', 'Elijah', 'Khadija', 'Peter', 'Ruth', 'Yusuf', 'Peace', 'Michael',
  'Hauwa', 'Joshua', 'Blessing', 'Emmanuel', 'Maryam', 'Caleb', 'Deborah', 'Sani', 'Favour', 'Isaac',
  'Amara', 'Joseph', 'Nafisa', 'Philip', 'Rebecca', 'Abdul', 'Naomi', 'Tobi', 'Hadiza', 'Jeremiah',
];

const LAST_NAMES = [
  'Bello', 'Okafor', 'Yusuf', 'Adeyemi', 'Lawal', 'Garba', 'Ibrahim', 'Musa', 'Abdullahi', 'Eze',
  'Ojo', 'Usman', 'Aliyu', 'Sule', 'Nwosu', 'Ajayi', 'Okeke', 'Bassey', 'Umar', 'Onyeka',
  'Mohammed', 'Idris', 'Balogun', 'Tanko', 'Adebayo', 'Chukwu', 'Sambo', 'Shuaibu', 'Danjuma', 'Yakubu',
  'Abiola', 'Nwankwo', 'Afolabi', 'Okon', 'Sadiq', 'Ifeanyi', 'Nnamdi', 'Babatunde', 'Ekanem', 'Salihu',
];

type SessionWindow = {
  sessionName: string;
  startYear: number;
  endYear: number;
  termStartDate: Date;
  termEndDate: Date;
  isActive: boolean;
};

type SchoolSeedConfig = {
  name: string;
  schoolCode: string;
  schoolTypeId: string;
  classIds: string[];
  classCodes: string[];
  address: string;
  state: string;
  localGovernment: string;
  district: string;
  ward: string;
};

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);

const normalizeCode = (value: string) => value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

const chunk = async <T>(items: T[], size: number, handler: (subset: T[]) => Promise<void>) => {
  for (let index = 0; index < items.length; index += size) {
    await handler(items.slice(index, index + size));
  }
};

const getWeekdays = (startDate: Date, endDate: Date) => {
  const dates: Date[] = [];
  const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const last = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  while (current <= last) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

const getAttendanceStatus = (studentIndex: number, dayIndex: number) => {
  const marker = (studentIndex * 7 + dayIndex * 11) % 100;
  if (marker < 7) {
    return 'absent' as const;
  }

  if (marker < 14) {
    return 'late' as const;
  }

  return 'present' as const;
};

const getStudentsPerClass = (schoolIndex: number, classIndex: number) => 30 + ((schoolIndex * 9 + classIndex * 5) % 21);

const buildSessionWindows = () => {
  const currentYear = TODAY.getUTCFullYear();
  const windows: SessionWindow[] = [];

  for (let startYear = 2023; startYear <= currentYear; startYear += 1) {
    const endYear = startYear + 1;
    const defaultStart = new Date(Date.UTC(startYear, 8, 1));
    const defaultEnd = new Date(Date.UTC(endYear, 7, 31, 23, 59, 59, 999));
    const termStartDate = startYear === 2023 ? START_DATE : defaultStart;
    const termEndDate = defaultEnd > TODAY ? TODAY : defaultEnd;

    if (termStartDate > TODAY) {
      continue;
    }

    windows.push({
      sessionName: `${startYear}/${endYear}`,
      startYear,
      endYear,
      termStartDate,
      termEndDate,
      isActive: termStartDate <= TODAY && termEndDate >= TODAY,
    });
  }

  return windows;
};

const resolveSchoolConfigs = async (schoolBoardCode: string) => {
  const schoolTypes = await SchoolType.find().sort({ name: 1 });
  if (schoolTypes.length === 0) {
    throw new Error('No school types found. Run seed:school-types first.');
  }

  const classes = await ClassModel.find().sort({ code: 1 });
  if (classes.length === 0) {
    throw new Error('No classes found. Run seed:classes first.');
  }

  const classesByType = new Map<string, typeof classes>();
  classes.forEach((classItem) => {
    const existing = classesByType.get(classItem.schoolTypeId) || [];
    existing.push(classItem);
    classesByType.set(classItem.schoolTypeId, existing);
  });

  const schoolTypePool = schoolTypes.filter((schoolType) => (classesByType.get(schoolType.id) || []).length > 0);
  if (schoolTypePool.length === 0) {
    throw new Error('No classes are linked to any school type. Run seed:classes first.');
  }

  return [0, 1].map((schoolIndex) => {
    const schoolType = schoolTypePool[schoolIndex] || schoolTypePool[0]!;
    const availableClasses = (classesByType.get(schoolType.id) || []).slice(0, 6);
    const classIds = availableClasses.map((item) => item.id);
    const classCodes = availableClasses.map((item) => item.code);
    const suffix = `${schoolIndex + 1}`;

    return {
      name: `${schoolType.name} Demonstration School ${suffix}`,
      schoolCode: `${schoolBoardCode}-${normalizeCode(schoolType.name)}-${suffix}`,
      schoolTypeId: schoolType.id,
      classIds,
      classCodes,
      address: `${10 + schoolIndex} Learning Avenue`,
      state: 'Plateau',
      localGovernment: schoolIndex === 0 ? 'Jos North' : 'Jos South',
      district: schoolIndex === 0 ? 'Central District' : 'Southern District',
      ward: `Ward ${schoolIndex + 1}`,
    } satisfies SchoolSeedConfig;
  });
};

const ensureAcademicSessions = async (schoolBoardId: string, sessionWindows: SessionWindow[]) => {
  const sessionIds = new Map<string, string>();

  for (const sessionWindow of sessionWindows) {
    const session = await AcademicSession.findOneAndUpdate(
      {
        schoolBoard: schoolBoardId,
        startYear: sessionWindow.startYear,
        endYear: sessionWindow.endYear,
      },
      {
        $set: {
          name: sessionWindow.sessionName,
          isActive: sessionWindow.isActive,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    sessionIds.set(sessionWindow.sessionName, session.id);
  }

  return sessionIds;
};

const ensureTerms = async (schoolBoardId: string, sessionWindows: SessionWindow[]) => {
  for (const sessionWindow of sessionWindows) {
    const scopedTermName = `Attendance Window ${sessionWindow.sessionName}`;
    const scopedName = `${sessionWindow.sessionName} - Attendance Window`;

    await Term.findOneAndUpdate(
      {
        schoolBoard: schoolBoardId,
        school: null,
        name: scopedName,
      },
      {
        $set: {
          name: scopedName,
          termName: scopedTermName,
          academicSession: sessionWindow.sessionName,
          startDate: sessionWindow.termStartDate,
          endDate: sessionWindow.termEndDate,
          isActive: sessionWindow.isActive,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const ensureSchools = async (schoolBoardId: string, configs: SchoolSeedConfig[]) => {
  const schools: Array<{ config: SchoolSeedConfig; school: any }> = [];

  for (const configItem of configs) {
    const school = await School.findOneAndUpdate(
      {
        schoolBoard: schoolBoardId,
        name: configItem.name,
      },
      {
        $set: {
          name: configItem.name,
          schoolBoard: schoolBoardId,
          schoolTypes: [configItem.schoolTypeId],
          classes: configItem.classIds,
          address: configItem.address,
          schoolCode: configItem.schoolCode,
          state: configItem.state,
          localGovernment: configItem.localGovernment,
          district: configItem.district,
          ward: configItem.ward,
          schoolLocation: 'Urban',
          categoryOfSchool: 'Public',
          accessRoadCondition: 'Tarred',
          typeOfSchool: 'Formal',
          shiftSystem: 'Single',
          facilitiesAvailable: 'Library, Staff Room, Playground, Computer Lab',
          numberOfClasses: configItem.classIds.length,
          numberOfClassroomsAvailable: configItem.classIds.length,
          status: 'active',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    schools.push({ config: configItem, school });
  }

  return schools;
};

const ensureStudentsAndEnrollments = async (
  schoolBoardId: string,
  schools: Array<{ config: SchoolSeedConfig; school: any }>,
  sessionWindows: SessionWindow[],
  sessionIds: Map<string, string>
) => {
  const studentRegNumbersBySchool = new Map<string, string[]>();

  for (let schoolIndex = 0; schoolIndex < schools.length; schoolIndex += 1) {
    const schoolEntry = schools[schoolIndex]!;
    const schoolRegNumbers: string[] = [];
    const studentOps: any[] = [];

    for (let classIndex = 0; classIndex < schoolEntry.config.classIds.length; classIndex += 1) {
      const classId = schoolEntry.config.classIds[classIndex]!;
      const classCode = schoolEntry.config.classCodes[classIndex]!;
      const studentsPerClass = getStudentsPerClass(schoolIndex, classIndex);

      for (let studentIndex = 0; studentIndex < studentsPerClass; studentIndex += 1) {
        const absoluteIndex = schoolIndex * 1000 + classIndex * 100 + studentIndex;
        const regNumber = `${normalizeCode(schoolEntry.config.schoolCode)}-${classCode}-${String(studentIndex + 1).padStart(2, '0')}`;
        const firstName = FIRST_NAMES[absoluteIndex % FIRST_NAMES.length]!;
        const lastName = LAST_NAMES[absoluteIndex % LAST_NAMES.length]!;
        const gender = absoluteIndex % 2 === 0 ? 'female' : 'male';
        const dateOfBirth = new Date(Date.UTC(2012 - (classIndex % 4), absoluteIndex % 12, (absoluteIndex % 27) + 1));

        schoolRegNumbers.push(regNumber);
        studentOps.push({
          updateOne: {
            filter: { regNumber },
            update: {
              $set: {
                firstName,
                middleName: null,
                lastName,
                regNumber,
                stateOfOrigin: schoolEntry.config.state,
                localGovernment: schoolEntry.config.localGovernment,
                gender,
                dateOfBirth,
                status: 'active',
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (studentOps.length > 0) {
      await chunk(studentOps, 1000, async (ops) => {
        await Student.bulkWrite(ops);
      });
    }

    const students = await Student.find({ regNumber: { $in: schoolRegNumbers } }).sort({ regNumber: 1 });
    const studentByRegNumber = new Map(students.map((student) => [student.regNumber, student]));
    const enrollmentOps: any[] = [];

    for (let classIndex = 0; classIndex < schoolEntry.config.classIds.length; classIndex += 1) {
      const classId = schoolEntry.config.classIds[classIndex]!;
      const classCode = schoolEntry.config.classCodes[classIndex]!;
      const studentsPerClass = getStudentsPerClass(schoolIndex, classIndex);

      for (let studentIndex = 0; studentIndex < studentsPerClass; studentIndex += 1) {
        const regNumber = `${normalizeCode(schoolEntry.config.schoolCode)}-${classCode}-${String(studentIndex + 1).padStart(2, '0')}`;
        const student = studentByRegNumber.get(regNumber);
        if (!student) {
          continue;
        }

        for (const sessionWindow of sessionWindows) {
          enrollmentOps.push({
            updateOne: {
              filter: {
                student: student.id,
                academicSession: sessionWindow.sessionName,
              },
              update: {
                $set: {
                  student: student.id,
                  schoolBoard: schoolBoardId,
                  school: schoolEntry.school.id,
                  classId,
                  academicSession: sessionWindow.sessionName,
                  academicSessionId: sessionIds.get(sessionWindow.sessionName) || null,
                  isCurrent: sessionWindow.isActive,
                },
              },
              upsert: true,
            },
          });
        }
      }
    }

    if (enrollmentOps.length > 0) {
      await chunk(enrollmentOps, 1000, async (ops) => {
        await StudentEnrollment.bulkWrite(ops);
      });
    }

    await School.findByIdAndUpdate(schoolEntry.school.id, {
      $set: {
        totalEnrolledStudents: schoolRegNumbers.length,
      },
    });

    studentRegNumbersBySchool.set(schoolEntry.school.id, schoolRegNumbers);
  }

  return studentRegNumbersBySchool;
};

const ensureAttendance = async (
  schools: Array<{ config: SchoolSeedConfig; school: any }>,
  sessionWindows: SessionWindow[],
  studentRegNumbersBySchool: Map<string, string[]>
) => {
  for (let schoolIndex = 0; schoolIndex < schools.length; schoolIndex += 1) {
    const schoolEntry = schools[schoolIndex]!;
    const regNumbers = studentRegNumbersBySchool.get(schoolEntry.school.id) || [];
    const students = await Student.find({ regNumber: { $in: regNumbers } }).sort({ regNumber: 1 });

    let attendanceOps: any[] = [];
    let attendanceCount = 0;

    for (const sessionWindow of sessionWindows) {
      const weekdays = getWeekdays(sessionWindow.termStartDate, sessionWindow.termEndDate);

      for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
        const student = students[studentIndex]!;

        for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex += 1) {
          const date = weekdays[dayIndex]!;

          attendanceOps.push({
            updateOne: {
              filter: {
                student: student.id,
                date,
              },
              update: {
                $set: {
                  student: student.id,
                  regNumber: student.regNumber,
                  schoolId: schoolEntry.school.id,
                  date,
                  status: getAttendanceStatus(studentIndex, dayIndex),
                  source: 'school-board-history-seed',
                },
              },
              upsert: true,
            },
          });

          attendanceCount += 1;

          if (attendanceOps.length >= 1000) {
            await Attendance.bulkWrite(attendanceOps);
            attendanceOps = [];
          }
        }
      }
    }

    if (attendanceOps.length > 0) {
      await Attendance.bulkWrite(attendanceOps);
    }

    logger.info(`Seeded attendance for ${schoolEntry.school.name}: ${attendanceCount} weekday records processed`);
  }
};

const run = async () => {
  const schoolBoardId = process.argv[2]?.trim();

  if (!schoolBoardId) {
    throw new Error('Usage: npm run seed:school-board-history -- <schoolBoardId>');
  }

  await mongoose.connect(config.mongoose.url);

  try {
    logger.info(`Connected to MongoDB for school board historical seed: ${schoolBoardId}`);

    const schoolBoard = await SchoolBoard.findById(schoolBoardId);
    if (!schoolBoard) {
      throw new Error(`School board not found: ${schoolBoardId}`);
    }

    const schoolBoardCode = normalizeCode(schoolBoard.code || schoolBoard.name).slice(0, 12) || 'SCHOOLBOARD';
    const sessionWindows = buildSessionWindows();
    const schoolConfigs = await resolveSchoolConfigs(schoolBoardCode);
    const sessionIds = await ensureAcademicSessions(schoolBoard.id, sessionWindows);
    await ensureTerms(schoolBoard.id, sessionWindows);
    const schools = await ensureSchools(schoolBoard.id, schoolConfigs);
    const studentRegNumbersBySchool = await ensureStudentsAndEnrollments(
      schoolBoard.id,
      schools,
      sessionWindows,
      sessionIds
    );
    await ensureAttendance(schools, sessionWindows, studentRegNumbersBySchool);

    const schoolSummaries = await Promise.all(
      schools.map(async ({ school }) => {
        const studentCount = await StudentEnrollment.countDocuments({ school: school.id, isCurrent: true });
        const attendanceCount = await Attendance.countDocuments({ schoolId: school.id, source: 'school-board-history-seed' });
        return {
          name: school.name,
          schoolCode: school.schoolCode,
          studentCount,
          attendanceCount,
        };
      })
    );

    logger.info(`Seeded school board: ${schoolBoard.name} (${schoolBoard.id})`);
    sessionWindows.forEach((sessionWindow) => {
      logger.info(
        `Term window: ${sessionWindow.sessionName} -> ${toDateKey(sessionWindow.termStartDate)} to ${toDateKey(sessionWindow.termEndDate)}`
      );
    });

    schoolSummaries.forEach((summary) => {
      logger.info(
        `School ${summary.name} (${summary.schoolCode}) -> current students: ${summary.studentCount}, attendance rows: ${summary.attendanceCount}`
      );
    });
  } finally {
    await mongoose.disconnect();
  }
};

run()
  .then(() => {
    logger.info('School board historical seed completed');
    process.exit(0);
  })
  .catch((error: Error) => {
    logger.error(error.message);
    process.exit(1);
  });