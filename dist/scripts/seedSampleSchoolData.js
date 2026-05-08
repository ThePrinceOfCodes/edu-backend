"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const schoolBoard_model_1 = __importDefault(require("../modules/school-board/schoolBoard.model"));
const term_model_1 = __importDefault(require("../modules/term/term.model"));
const schoolType_model_1 = __importDefault(require("../modules/school-type/schoolType.model"));
const class_model_1 = __importDefault(require("../modules/class/class.model"));
const school_model_1 = __importDefault(require("../modules/school/school.model"));
const student_model_1 = __importDefault(require("../modules/student/student.model"));
const attendance_model_1 = __importDefault(require("../modules/attendance/attendance.model"));
const user_model_1 = __importDefault(require("../modules/users/user.model"));
const auth_model_1 = __importDefault(require("../modules/auth/auth.model"));
const staff_model_1 = __importDefault(require("../modules/staff/staff.model"));
const SAMPLE_SCHOOL_NAME = 'Sample school';
const SAMPLE_SCHOOL_CODE = 'SAMPLE-SCH';
const PRIMARY_CLASS_CODES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
const STUDENTS_PER_CLASS = 5;
const SAMPLE_STAFF = [
    {
        name: 'Mary Johnson',
        email: 'sample.teacher1@education.local',
        phoneNumber: '08030000101',
        employeeId: 'SAMPLE-T001',
        designation: 'Primary 1 Teacher',
        employmentType: 'teacher',
        role: 'teacher',
    },
    {
        name: 'Paul Ibrahim',
        email: 'sample.teacher2@education.local',
        phoneNumber: '08030000102',
        employeeId: 'SAMPLE-T002',
        designation: 'Primary 2 Teacher',
        employmentType: 'teacher',
        role: 'teacher',
    },
    {
        name: 'Deborah Musa',
        email: 'sample.teacher3@education.local',
        phoneNumber: '08030000103',
        employeeId: 'SAMPLE-T003',
        designation: 'Primary 3 Teacher',
        employmentType: 'teacher',
        role: 'teacher',
    },
    {
        name: 'Stephen Okafor',
        email: 'sample.teacher4@education.local',
        phoneNumber: '08030000104',
        employeeId: 'SAMPLE-T004',
        designation: 'Primary 4 Teacher',
        employmentType: 'teacher',
        role: 'teacher',
    },
    {
        name: 'Janet Bello',
        email: 'sample.staff1@education.local',
        phoneNumber: '08030000105',
        employeeId: 'SAMPLE-S001',
        designation: 'School Secretary',
        employmentType: 'staff',
        role: 'staff',
    },
    {
        name: 'Thomas Yusuf',
        email: 'sample.staff2@education.local',
        phoneNumber: '08030000106',
        employeeId: 'SAMPLE-S002',
        designation: 'Administrative Officer',
        employmentType: 'staff',
        role: 'staff',
    },
];
const SAMPLE_STAFF_PASSWORD = 'SamplePass123!';
const SAMPLE_SCHOOL_ADMIN = {
    name: 'Sample School Admin',
    email: 'sample.schooladmin@education.local',
    phoneNumber: '08030000100',
};
const SAMPLE_SCHOOL_ADMIN_PASSWORD = 'SampleAdmin123!';
const FIRST_NAMES = [
    'Amina', 'Chinedu', 'Fatima', 'David', 'Grace',
    'Musa', 'Esther', 'Samuel', 'Zainab', 'Daniel',
    'Mercy', 'Ibrahim', 'Joy', 'Elijah', 'Khadija',
    'Peter', 'Ruth', 'Yusuf', 'Peace', 'Michael',
    'Hauwa', 'Joshua', 'Blessing', 'Emmanuel', 'Maryam',
    'Caleb', 'Deborah', 'Sani', 'Favour', 'Isaac',
];
const LAST_NAMES = [
    'Bello', 'Okafor', 'Yusuf', 'Adeyemi', 'Lawal',
    'Garba', 'Ibrahim', 'Musa', 'Abdullahi', 'Eze',
    'Ojo', 'Usman', 'Aliyu', 'Sule', 'Nwosu',
    'Ajayi', 'Okeke', 'Bassey', 'Umar', 'Onyeka',
    'Mohammed', 'Idris', 'Balogun', 'Tanko', 'Adebayo',
    'Chukwu', 'Sambo', 'Shuaibu', 'Danjuma', 'Yakubu',
];
const toDateKey = (value) => value.toISOString().slice(0, 10);
const buildDateRange = (startDate, endDate) => {
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setUTCHours(0, 0, 0, 0);
    const days = [];
    while (current <= last) {
        days.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
};
const getAttendanceStatus = (studentIndex, dayIndex, date) => {
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'excused';
    }
    const marker = (studentIndex + dayIndex) % 20;
    if (marker === 0) {
        return 'absent';
    }
    if (marker === 1 || marker === 2) {
        return 'late';
    }
    return 'present';
};
const upsertSampleUser = async (staffMember, schoolBoardId, schoolId) => {
    let user = await user_model_1.default.findOne({ email: staffMember.email });
    if (!user) {
        user = new user_model_1.default({
            name: staffMember.name,
            email: staffMember.email,
            phoneNumber: staffMember.phoneNumber,
            accountType: 'client',
            role: staffMember.role,
            schoolBoardId,
            schoolId,
            isVerified: true,
            status: 'active',
        });
    }
    else {
        user.name = staffMember.name;
        user.phoneNumber = staffMember.phoneNumber;
        user.accountType = 'client';
        user.role = staffMember.role;
        user.schoolBoardId = schoolBoardId;
        user.schoolId = schoolId;
        user.isVerified = true;
        user.status = 'active';
    }
    await user.save();
    let auth = await auth_model_1.default.findOne({ user: user.id });
    if (!auth) {
        auth = new auth_model_1.default({
            user: user.id,
            provider: 'email',
            email: staffMember.email,
            password: SAMPLE_STAFF_PASSWORD,
        });
    }
    else {
        auth.email = staffMember.email;
        if (!auth.password) {
            auth.password = SAMPLE_STAFF_PASSWORD;
        }
    }
    await auth.save();
    return user;
};
const run = async () => {
    try {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
        logger_1.default.info('Connected to MongoDB for sample school seed');
        const activeTerms = await term_model_1.default.find({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 });
        if (activeTerms.length === 0) {
            throw new Error('No active term found. Activate a term before running this seed.');
        }
        const activeTerm = activeTerms[0];
        const schoolBoard = await schoolBoard_model_1.default.findById(activeTerm.schoolBoard);
        if (!schoolBoard) {
            throw new Error(`School board not found for active term: ${activeTerm.schoolBoard}`);
        }
        const primarySchoolType = await schoolType_model_1.default.findOne({ name: 'Primary' });
        if (!primarySchoolType) {
            throw new Error('Primary school type not found. Run seed:school-types first.');
        }
        const primaryClasses = await class_model_1.default.find({
            schoolTypeId: primarySchoolType.id,
            code: { $in: PRIMARY_CLASS_CODES },
        }).sort({ code: 1 });
        if (primaryClasses.length !== PRIMARY_CLASS_CODES.length) {
            throw new Error('Primary classes are incomplete. Run seed:classes first.');
        }
        const school = await school_model_1.default.findOneAndUpdate({ name: SAMPLE_SCHOOL_NAME, schoolBoard: schoolBoard.id }, {
            $set: {
                name: SAMPLE_SCHOOL_NAME,
                schoolBoard: schoolBoard.id,
                schoolTypes: [primarySchoolType.id],
                classes: primaryClasses.map((item) => item.id),
                address: '12 Sample Road, Jos',
                schoolCode: SAMPLE_SCHOOL_CODE,
                state: 'Plateau',
                localGovernment: 'Jos North',
                district: 'Sample District',
                ward: 'Ward 1',
                schoolLocation: 'Urban',
                categoryOfSchool: 'Public',
                accessRoadCondition: 'Tarred',
                typeOfSchool: 'Primary',
                shiftSystem: 'Single',
                facilitiesAvailable: 'Library, Staff Room, Playground',
                headTeacherName: 'Head Teacher Sample',
                headTeacherPhoneNumber: '08030000010',
                assistantHeadTeacherName: 'Assistant Sample',
                assistantHeadTeacherPhoneNumber: '08030000011',
                longitude: 8.89,
                latitude: 9.93,
                numberOfClasses: PRIMARY_CLASS_CODES.length,
                numberOfClassroomsAvailable: PRIMARY_CLASS_CODES.length,
                numberOfAcademicStaff: 12,
                numberOfNonAcademicStaff: 4,
                totalEnrolledStudents: PRIMARY_CLASS_CODES.length * STUDENTS_PER_CLASS,
                gallery: 'https://example.com/sample-school',
                status: 'active',
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        const studentWrites = [];
        const expectedRegNumbers = [];
        for (let classIndex = 0; classIndex < primaryClasses.length; classIndex += 1) {
            const classItem = primaryClasses[classIndex];
            for (let offset = 0; offset < STUDENTS_PER_CLASS; offset += 1) {
                const studentIndex = classIndex * STUDENTS_PER_CLASS + offset;
                const regNumber = `SAMPLE-${classItem.code}-${String(offset + 1).padStart(2, '0')}`;
                expectedRegNumbers.push(regNumber);
                const firstName = FIRST_NAMES[studentIndex % FIRST_NAMES.length];
                const lastName = LAST_NAMES[studentIndex % LAST_NAMES.length];
                const gender = studentIndex % 2 === 0 ? 'female' : 'male';
                const dateOfBirth = new Date(Date.UTC(2014 - (classIndex % 3), (studentIndex % 12), (studentIndex % 27) + 1));
                studentWrites.push({
                    updateOne: {
                        filter: { regNumber },
                        update: {
                            $set: {
                                firstName,
                                middleName: null,
                                lastName,
                                regNumber,
                                stateOfOrigin: 'Plateau',
                                localGovernment: 'Jos North',
                                gender,
                                dateOfBirth,
                                schoolBoard: schoolBoard.id,
                                school: school.id,
                                classId: classItem.id,
                                status: 'active',
                            },
                            $setOnInsert: {
                                promotionHistory: [
                                    {
                                        fromSchool: null,
                                        toSchool: school.id,
                                        fromClassId: null,
                                        toClassId: classItem.id,
                                        action: 'created',
                                        changedAt: new Date(),
                                    },
                                ],
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }
        if (studentWrites.length > 0) {
            await student_model_1.default.bulkWrite(studentWrites);
        }
        const students = await student_model_1.default.find({ regNumber: { $in: expectedRegNumbers }, school: school.id }).sort({ regNumber: 1 });
        const dateRange = buildDateRange(new Date(activeTerm.startDate), new Date(activeTerm.endDate));
        const attendanceWrites = [];
        for (let studentIndex = 0; studentIndex < students.length; studentIndex += 1) {
            const student = students[studentIndex];
            for (let dayIndex = 0; dayIndex < dateRange.length; dayIndex += 1) {
                const date = dateRange[dayIndex];
                const status = getAttendanceStatus(studentIndex, dayIndex, date);
                attendanceWrites.push({
                    updateOne: {
                        filter: {
                            student: student.id,
                            date,
                        },
                        update: {
                            $set: {
                                student: student.id,
                                schoolBoard: schoolBoard.id,
                                school: school.id,
                                academicSessionId: activeTerm.academicSession,
                                termId: activeTerm.id,
                                date,
                                status,
                                source: 'sample-seed',
                            },
                        },
                        upsert: true,
                    },
                });
            }
        }
        if (attendanceWrites.length > 0) {
            await attendance_model_1.default.bulkWrite(attendanceWrites);
        }
        for (const staffMember of SAMPLE_STAFF) {
            const user = await upsertSampleUser(staffMember, schoolBoard.id, school.id);
            const existingStaff = await staff_model_1.default.findOne({ user: user.id });
            if (!existingStaff) {
                await staff_model_1.default.create({
                    user: user.id,
                    schoolBoard: schoolBoard.id,
                    school: school.id,
                    employeeId: staffMember.employeeId,
                    designation: staffMember.designation,
                    employmentType: staffMember.employmentType,
                    isActive: true,
                });
            }
            else {
                existingStaff.schoolBoard = schoolBoard.id;
                existingStaff.school = school.id;
                existingStaff.employeeId = staffMember.employeeId;
                existingStaff.designation = staffMember.designation;
                existingStaff.employmentType = staffMember.employmentType;
                existingStaff.isActive = true;
                await existingStaff.save();
            }
        }
        // Upsert school-admin user
        let adminUser = await user_model_1.default.findOne({ email: SAMPLE_SCHOOL_ADMIN.email });
        if (!adminUser) {
            adminUser = new user_model_1.default({
                name: SAMPLE_SCHOOL_ADMIN.name,
                email: SAMPLE_SCHOOL_ADMIN.email,
                phoneNumber: SAMPLE_SCHOOL_ADMIN.phoneNumber,
                accountType: 'client',
                role: 'school-admin',
                schoolBoardId: schoolBoard.id,
                schoolId: school.id,
                isVerified: true,
                status: 'active',
            });
        }
        else {
            adminUser.name = SAMPLE_SCHOOL_ADMIN.name;
            adminUser.phoneNumber = SAMPLE_SCHOOL_ADMIN.phoneNumber;
            adminUser.accountType = 'client';
            adminUser.role = 'school-admin';
            adminUser.schoolBoardId = schoolBoard.id;
            adminUser.schoolId = school.id;
            adminUser.isVerified = true;
            adminUser.status = 'active';
        }
        await adminUser.save();
        let adminAuth = await auth_model_1.default.findOne({ user: adminUser.id });
        if (!adminAuth) {
            adminAuth = new auth_model_1.default({
                user: adminUser.id,
                provider: 'email',
                email: SAMPLE_SCHOOL_ADMIN.email,
                password: SAMPLE_SCHOOL_ADMIN_PASSWORD,
            });
        }
        else {
            adminAuth.email = SAMPLE_SCHOOL_ADMIN.email;
            adminAuth.password = SAMPLE_SCHOOL_ADMIN_PASSWORD;
        }
        await adminAuth.save();
        const attendanceCount = await attendance_model_1.default.countDocuments({ school: school.id, termId: activeTerm.id });
        const staffCount = await staff_model_1.default.countDocuments({ school: school.id, isActive: true });
        logger_1.default.info(`Seeded school board: ${schoolBoard.name} (${schoolBoard.id})`);
        logger_1.default.info(`Seeded school: ${school.name} (${school.id})`);
        logger_1.default.info(`Seeded ${students.length} sample students`);
        logger_1.default.info(`Seeded ${staffCount} sample staff records`);
        logger_1.default.info(`Seeded ${attendanceCount} attendance records for active term ${activeTerm.name}`);
        logger_1.default.info(`Attendance date range: ${toDateKey(new Date(activeTerm.startDate))} -> ${toDateKey(new Date(activeTerm.endDate))}`);
        logger_1.default.info(`School-admin credentials  →  email: ${SAMPLE_SCHOOL_ADMIN.email}  |  password: ${SAMPLE_SCHOOL_ADMIN_PASSWORD}`);
        logger_1.default.info(`Staff password: ${SAMPLE_STAFF_PASSWORD}`);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
run()
    .then(() => {
    logger_1.default.info('Sample school seed completed');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error(error.message);
    process.exit(1);
});
//# sourceMappingURL=seedSampleSchoolData.js.map