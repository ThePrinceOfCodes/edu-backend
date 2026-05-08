"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudentById = exports.promoteStudentById = exports.updateStudentById = exports.getStudentById = exports.queryStudents = exports.createStudentsBulk = exports.createStudent = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_1 = require("../school");
const class_1 = require("../class");
const student_model_1 = __importDefault(require("./student.model"));
const buildStudentAccessFilter = (actor) => {
    if (actor.accountType === 'internal') {
        return {};
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return { schoolBoard: actor.schoolBoardId };
    }
    if (actor.role === 'school-admin') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        return { school: actor.schoolId };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin or school admin can access students');
};
const validateSchoolAndClass = async (schoolId, classId, actor) => {
    const school = await school_1.School.findById(schoolId);
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    if (actor.accountType !== 'internal') {
        if (actor.role === 'school-admin' && actor.schoolId !== school.id) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot manage students outside your school');
        }
        if (actor.role === 'school-board-admin' && school.schoolBoard !== actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot manage students outside your school board');
        }
    }
    const classItem = await class_1.ClassModel.findById(classId);
    if (!classItem) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    if (school.classes && school.classes.length > 0 && !school.classes.includes(classItem.id)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Selected class is not configured for the selected school via school types');
    }
    return { school, classItem };
};
const createStudentInternal = async (studentBody, actor) => {
    const { school, classItem } = await validateSchoolAndClass(studentBody.school, studentBody.classId, actor);
    const regNumber = studentBody.regNumber.trim().toUpperCase();
    const existingStudent = await student_model_1.default.findOne({ regNumber });
    if (existingStudent) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `Student regNumber already exists: ${regNumber}`);
    }
    return student_model_1.default.create({
        firstName: studentBody.firstName,
        middleName: studentBody.middleName || null,
        lastName: studentBody.lastName,
        regNumber,
        stateOfOrigin: studentBody.stateOfOrigin,
        localGovernment: studentBody.localGovernment,
        gender: studentBody.gender,
        dateOfBirth: studentBody.dateOfBirth,
        schoolBoard: school.schoolBoard || null,
        school: school.id,
        classId: classItem.id,
        status: studentBody.status || 'active',
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
    });
};
const createStudent = async (studentBody, actor) => {
    return createStudentInternal(studentBody, actor);
};
exports.createStudent = createStudent;
const createStudentsBulk = async (students, actor) => {
    const created = [];
    const failed = [];
    for (const [index, payload] of students.entries()) {
        try {
            const student = await createStudentInternal(payload, actor);
            created.push(student);
        }
        catch (error) {
            failed.push({
                row: index + 1,
                regNumber: payload.regNumber,
                reason: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        total: students.length,
        createdCount: created.length,
        failedCount: failed.length,
        created,
        failed,
    };
};
exports.createStudentsBulk = createStudentsBulk;
const queryStudents = async (filter, options, actor) => {
    const accessFilter = buildStudentAccessFilter(actor);
    return student_model_1.default.paginate(Object.assign(Object.assign({}, filter), accessFilter), options);
};
exports.queryStudents = queryStudents;
const getStudentById = async (studentId, actor) => {
    const accessFilter = buildStudentAccessFilter(actor);
    const student = await student_model_1.default.findOne(Object.assign({ _id: studentId }, accessFilter));
    if (!student) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    return student;
};
exports.getStudentById = getStudentById;
const updateStudentById = async (studentId, updateBody, actor) => {
    const student = await (0, exports.getStudentById)(studentId, actor);
    if (updateBody.regNumber) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'regNumber cannot be updated');
    }
    if (updateBody.school || updateBody.classId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Use promote endpoint to change school or class');
    }
    Object.assign(student, updateBody);
    await student.save();
    return student;
};
exports.updateStudentById = updateStudentById;
const promoteStudentById = async (studentId, payload, actor) => {
    const student = await (0, exports.getStudentById)(studentId, actor);
    const nextSchoolId = payload.school || student.school;
    const { school, classItem } = await validateSchoolAndClass(nextSchoolId, payload.classId, actor);
    if (student.school === school.id && student.classId === classItem.id) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Student is already in the selected class and school');
    }
    const action = student.school === school.id ? 'promoted' : 'transferred';
    student.promotionHistory = [
        ...(student.promotionHistory || []),
        {
            fromSchool: student.school,
            toSchool: school.id,
            fromClassId: student.classId,
            toClassId: classItem.id,
            action,
            changedAt: new Date(),
        },
    ];
    student.school = school.id;
    student.schoolBoard = school.schoolBoard || null;
    student.classId = classItem.id;
    await student.save();
    return student;
};
exports.promoteStudentById = promoteStudentById;
const deleteStudentById = async (studentId, actor) => {
    const student = await (0, exports.getStudentById)(studentId, actor);
    await student.deleteOne();
    return student;
};
exports.deleteStudentById = deleteStudentById;
//# sourceMappingURL=student.service.js.map