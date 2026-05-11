"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const schoolBoard_model_1 = __importDefault(require("../modules/school-board/schoolBoard.model"));
const schoolType_model_1 = __importDefault(require("../modules/school-type/schoolType.model"));
const class_model_1 = __importDefault(require("../modules/class/class.model"));
const school_model_1 = __importDefault(require("../modules/school/school.model"));
const student_model_1 = __importDefault(require("../modules/student/student.model"));
const studentEnrollment_model_1 = __importDefault(require("../modules/student/studentEnrollment.model"));
const attendance_model_1 = __importDefault(require("../modules/attendance/attendance.model"));
const academicSession_model_1 = __importDefault(require("../modules/academic-session/academicSession.model"));
const term_model_1 = __importDefault(require("../modules/term/term.model"));
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
const toDateKey = (value) => value.toISOString().slice(0, 10);
const normalizeCode = (value) => value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
const chunk = async (items, size, handler) => {
    for (let index = 0; index < items.length; index += size) {
        await handler(items.slice(index, index + size));
    }
};
const getWeekdays = (startDate, endDate) => {
    const dates = [];
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
const getAttendanceStatus = (studentIndex, dayIndex) => {
    const marker = (studentIndex * 7 + dayIndex * 11) % 100;
    if (marker < 7) {
        return 'absent';
    }
    if (marker < 14) {
        return 'late';
    }
    return 'present';
};
const getStudentsPerClass = (schoolIndex, classIndex) => 30 + ((schoolIndex * 9 + classIndex * 5) % 21);
const buildSessionWindows = () => {
    const currentYear = TODAY.getUTCFullYear();
    const windows = [];
    for (let startYear = 2010; startYear <= currentYear; startYear += 1) {
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
const resolveSchoolConfigs = async (schoolBoardCode) => {
    const schoolTypes = await schoolType_model_1.default.find().sort({ name: 1 });
    if (schoolTypes.length === 0) {
        throw new Error('No school types found. Run seed:school-types first.');
    }
    const classes = await class_model_1.default.find().sort({ code: 1 });
    if (classes.length === 0) {
        throw new Error('No classes found. Run seed:classes first.');
    }
    const classesByType = new Map();
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
        const schoolType = schoolTypePool[schoolIndex] || schoolTypePool[0];
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
        };
    });
};
const ensureAcademicSessions = async (schoolBoardId, sessionWindows) => {
    const sessionIds = new Map();
    for (const sessionWindow of sessionWindows) {
        const session = await academicSession_model_1.default.findOneAndUpdate({
            schoolBoard: schoolBoardId,
            startYear: sessionWindow.startYear,
            endYear: sessionWindow.endYear,
        }, {
            $set: {
                name: sessionWindow.sessionName,
                isActive: sessionWindow.isActive,
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        sessionIds.set(sessionWindow.sessionName, session.id);
    }
    return sessionIds;
};
const ensureTerms = async (schoolBoardId, sessionWindows) => {
    for (const sessionWindow of sessionWindows) {
        const scopedTermName = `Attendance Window ${sessionWindow.sessionName}`;
        const scopedName = `${sessionWindow.sessionName} - Attendance Window`;
        await term_model_1.default.findOneAndUpdate({
            schoolBoard: schoolBoardId,
            school: null,
            name: scopedName,
        }, {
            $set: {
                name: scopedName,
                termName: scopedTermName,
                academicSession: sessionWindow.sessionName,
                startDate: sessionWindow.termStartDate,
                endDate: sessionWindow.termEndDate,
                isActive: sessionWindow.isActive,
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
};
const ensureSchools = async (schoolBoardId, configs) => {
    const schools = [];
    for (const configItem of configs) {
        const school = await school_model_1.default.findOneAndUpdate({
            schoolBoard: schoolBoardId,
            name: configItem.name,
        }, {
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
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        schools.push({ config: configItem, school });
    }
    return schools;
};
const ensureStudentsAndEnrollments = async (schoolBoardId, schools, sessionWindows, sessionIds) => {
    const studentRegNumbersBySchool = new Map();
    for (let schoolIndex = 0; schoolIndex < schools.length; schoolIndex += 1) {
        const schoolEntry = schools[schoolIndex];
        const schoolRegNumbers = [];
        const studentOps = [];
        for (let classIndex = 0; classIndex < schoolEntry.config.classIds.length; classIndex += 1) {
            const classId = schoolEntry.config.classIds[classIndex];
            const classCode = schoolEntry.config.classCodes[classIndex];
            // Mark classId as intentionally used for future enrollment ops
            void classId;
            const studentsPerClass = getStudentsPerClass(schoolIndex, classIndex);
            for (let studentIndex = 0; studentIndex < studentsPerClass; studentIndex += 1) {
                const absoluteIndex = schoolIndex * 1000 + classIndex * 100 + studentIndex;
                const regNumber = `${normalizeCode(schoolEntry.config.schoolCode)}-${classCode}-${String(studentIndex + 1).padStart(2, '0')}`;
                const firstName = FIRST_NAMES[absoluteIndex % FIRST_NAMES.length];
                const lastName = LAST_NAMES[absoluteIndex % LAST_NAMES.length];
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
                await student_model_1.default.bulkWrite(ops);
            });
        }
        const students = await student_model_1.default.find({ regNumber: { $in: schoolRegNumbers } }).sort({ regNumber: 1 });
        const studentByRegNumber = new Map(students.map((student) => [student.regNumber, student]));
        const enrollmentOps = [];
        for (let classIndex = 0; classIndex < schoolEntry.config.classIds.length; classIndex += 1) {
            const classId = schoolEntry.config.classIds[classIndex];
            const classCode = schoolEntry.config.classCodes[classIndex];
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
                await studentEnrollment_model_1.default.bulkWrite(ops);
            });
        }
        await school_model_1.default.findByIdAndUpdate(schoolEntry.school.id, {
            $set: {
                totalEnrolledStudents: schoolRegNumbers.length,
            },
        });
        studentRegNumbersBySchool.set(schoolEntry.school.id, schoolRegNumbers);
    }
    return studentRegNumbersBySchool;
};
const ensureAttendance = async (schools, sessionWindows, studentRegNumbersBySchool) => {
    for (let schoolIndex = 0; schoolIndex < schools.length; schoolIndex += 1) {
        const schoolEntry = schools[schoolIndex];
        const regNumbers = studentRegNumbersBySchool.get(schoolEntry.school.id) || [];
        const students = await student_model_1.default.find({ regNumber: { $in: regNumbers } }).sort({ regNumber: 1 });
        let attendanceOps = [];
        let attendanceCount = 0;
        for (const sessionWindow of sessionWindows) {
            const weekdays = getWeekdays(sessionWindow.termStartDate, sessionWindow.termEndDate);
            for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
                const student = students[studentIndex];
                for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex += 1) {
                    const date = weekdays[dayIndex];
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
                        await attendance_model_1.default.bulkWrite(attendanceOps);
                        attendanceOps = [];
                    }
                }
            }
        }
        if (attendanceOps.length > 0) {
            await attendance_model_1.default.bulkWrite(attendanceOps);
        }
        logger_1.default.info(`Seeded attendance for ${schoolEntry.school.name}: ${attendanceCount} weekday records processed`);
    }
};
const run = async () => {
    var _a;
    const schoolBoardId = (_a = process.argv[2]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!schoolBoardId) {
        throw new Error('Usage: npm run seed:school-board-history -- <schoolBoardId>');
    }
    await mongoose_1.default.connect(config_1.default.mongoose.url);
    try {
        logger_1.default.info(`Connected to MongoDB for school board historical seed: ${schoolBoardId}`);
        const schoolBoard = await schoolBoard_model_1.default.findById(schoolBoardId);
        if (!schoolBoard) {
            throw new Error(`School board not found: ${schoolBoardId}`);
        }
        const schoolBoardCode = normalizeCode(schoolBoard.code || schoolBoard.name).slice(0, 12) || 'SCHOOLBOARD';
        const sessionWindows = buildSessionWindows();
        const schoolConfigs = await resolveSchoolConfigs(schoolBoardCode);
        const sessionIds = await ensureAcademicSessions(schoolBoard.id, sessionWindows);
        await ensureTerms(schoolBoard.id, sessionWindows);
        const schools = await ensureSchools(schoolBoard.id, schoolConfigs);
        const studentRegNumbersBySchool = await ensureStudentsAndEnrollments(schoolBoard.id, schools, sessionWindows, sessionIds);
        await ensureAttendance(schools, sessionWindows, studentRegNumbersBySchool);
        const schoolSummaries = await Promise.all(schools.map(async ({ school }) => {
            const studentCount = await studentEnrollment_model_1.default.countDocuments({ school: school.id, isCurrent: true });
            const attendanceCount = await attendance_model_1.default.countDocuments({ schoolId: school.id, source: 'school-board-history-seed' });
            return {
                name: school.name,
                schoolCode: school.schoolCode,
                studentCount,
                attendanceCount,
            };
        }));
        logger_1.default.info(`Seeded school board: ${schoolBoard.name} (${schoolBoard.id})`);
        sessionWindows.forEach((sessionWindow) => {
            logger_1.default.info(`Term window: ${sessionWindow.sessionName} -> ${toDateKey(sessionWindow.termStartDate)} to ${toDateKey(sessionWindow.termEndDate)}`);
        });
        schoolSummaries.forEach((summary) => {
            logger_1.default.info(`School ${summary.name} (${summary.schoolCode}) -> current students: ${summary.studentCount}, attendance rows: ${summary.attendanceCount}`);
        });
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
run()
    .then(() => {
    logger_1.default.info('School board historical seed completed');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error(error.message);
    process.exit(1);
});
//# sourceMappingURL=seedSchoolBoardHistoricalData.js.map