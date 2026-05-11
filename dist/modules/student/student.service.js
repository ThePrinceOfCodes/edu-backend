"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
const studentEnrollment_model_1 = __importDefault(require("./studentEnrollment.model"));
const studentEnrollment_helpers_1 = require("./studentEnrollment.helpers");
const assertStudentReadAccessRole = (actor) => {
    if (actor.accountType === 'internal') {
        return;
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return;
    }
    if (actor.role === 'school-admin') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        return;
    }
    if (actor.role === 'guardian') {
        return;
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'You are not allowed to access students');
};
const assertStudentWriteAccessRole = (actor) => {
    if (actor.accountType === 'internal') {
        return;
    }
    if (actor.role === 'school-board-admin') {
        if (!actor.schoolBoardId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
        }
        return;
    }
    if (actor.role === 'school-admin') {
        if (!actor.schoolId) {
            throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
        }
        return;
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
const sortStudents = (students, sortBy) => {
    if (!sortBy) {
        return [...students].sort((left, right) => {
            const leftTime = left.createdAt instanceof Date ? left.createdAt.getTime() : new Date(left.createdAt).getTime();
            const rightTime = right.createdAt instanceof Date ? right.createdAt.getTime() : new Date(right.createdAt).getTime();
            return leftTime - rightTime;
        });
    }
    const [sortField, sortOrder] = sortBy.split(':');
    if (!sortField) {
        return students;
    }
    const direction = sortOrder === 'desc' ? -1 : 1;
    return [...students].sort((left, right) => {
        const leftValue = left[sortField];
        const rightValue = right[sortField];
        if (leftValue === rightValue) {
            return 0;
        }
        if (leftValue === undefined || leftValue === null) {
            return 1;
        }
        if (rightValue === undefined || rightValue === null) {
            return -1;
        }
        return leftValue > rightValue ? direction : -direction;
    });
};
const paginateStudents = (students, options) => {
    const limit = options.limit && parseInt(options.limit.toString(), 10) > 0 ? parseInt(options.limit.toString(), 10) : 10;
    const page = options.page && parseInt(options.page.toString(), 10) > 0 ? parseInt(options.page.toString(), 10) : 1;
    const sorted = sortStudents(students, options.sortBy);
    const totalResults = sorted.length;
    const totalPages = Math.ceil(totalResults / limit) || 1;
    const start = (page - 1) * limit;
    return {
        results: sorted.slice(start, start + limit),
        page,
        limit,
        totalPages,
        totalResults,
    };
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const serializeStudent = (student, placement) => {
    const json = typeof student.toJSON === 'function' ? student.toJSON() : student;
    return Object.assign(Object.assign({}, json), (placement
        ? {
            schoolBoard: placement.schoolBoard || null,
            school: placement.school,
            classId: placement.classId,
            currentEnrollment: {
                schoolBoard: placement.schoolBoard || null,
                school: placement.school,
                classId: placement.classId,
                academicSession: placement.academicSession || null,
                academicSessionId: placement.academicSessionId || null,
                isCurrent: placement.isCurrent !== false,
            },
        }
        : { currentEnrollment: null }));
};
const getStudentWithPlacement = async (studentId) => {
    const student = await student_model_1.default.findById(studentId);
    if (!student) {
        return { student: null, placement: null };
    }
    const currentMap = await (0, studentEnrollment_helpers_1.getCurrentEnrollmentMap)([student.id]);
    return {
        student,
        placement: (0, studentEnrollment_helpers_1.getEffectivePlacement)(student, null, currentMap.get(student.id)),
    };
};
const canActorAccessPlacement = (actor, placement, schoolBoardSchoolIds) => {
    if (actor.accountType === 'internal') {
        return true;
    }
    if (!placement) {
        return false;
    }
    if (actor.role === 'school-board-admin') {
        if (placement.schoolBoard === actor.schoolBoardId) {
            return true;
        }
        // Backward-compatible fallback for enrollment rows without schoolBoard.
        return Boolean(schoolBoardSchoolIds && schoolBoardSchoolIds.has(placement.school));
    }
    if (actor.role === 'school-admin') {
        return placement.school === actor.schoolId;
    }
    if (actor.role === 'guardian') {
        const guardianIds = Array.isArray(placement === null || placement === void 0 ? void 0 : placement.guardianIds) ? placement.guardianIds : [];
        return guardianIds.includes(actor.id);
    }
    return false;
};
const createStudentInternal = async (studentBody, actor) => {
    assertStudentWriteAccessRole(actor);
    const { school, classItem } = await validateSchoolAndClass(studentBody.school, studentBody.classId, actor);
    const regNumber = studentBody.regNumber.trim().toUpperCase();
    const existingStudent = await student_model_1.default.findOne({ regNumber });
    if (existingStudent) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `Student regNumber already exists: ${regNumber}`);
    }
    const student = await student_model_1.default.create({
        firstName: studentBody.firstName,
        middleName: studentBody.middleName || null,
        lastName: studentBody.lastName,
        regNumber,
        stateOfOrigin: studentBody.stateOfOrigin,
        localGovernment: studentBody.localGovernment,
        gender: studentBody.gender,
        dateOfBirth: studentBody.dateOfBirth,
        guardianIds: Array.isArray(studentBody.guardianIds) ? studentBody.guardianIds : [],
        status: studentBody.status || 'active',
    });
    const enrollment = await (0, studentEnrollment_helpers_1.upsertStudentEnrollment)({
        studentId: student.id,
        schoolBoardId: school.schoolBoard || null,
        schoolId: school.id,
        classId: classItem.id,
    });
    return serializeStudent(student, enrollment);
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
    assertStudentReadAccessRole(actor);
    const { q, school, classId, academicSession, academicSessionId } = filter, studentFilter = __rest(filter, ["q", "school", "classId", "academicSession", "academicSessionId"]);
    if (q && typeof q === 'string' && q.trim()) {
        const safe = escapeRegex(q.trim());
        const searchRegex = new RegExp(safe, 'i');
        studentFilter['$or'] = [
            { firstName: searchRegex },
            { middleName: searchRegex },
            { lastName: searchRegex },
            { regNumber: searchRegex },
            { stateOfOrigin: searchRegex },
            { localGovernment: searchRegex },
        ];
    }
    // Enforce strict school scope for school-admin
    if (actor.accountType !== 'internal' && actor.role === 'school-admin' && school && school !== actor.schoolId) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot access students from another school');
    }
    const students = await student_model_1.default.find(studentFilter);
    const studentIds = students.map((student) => student.id);
    const currentMap = await (0, studentEnrollment_helpers_1.getCurrentEnrollmentMap)(studentIds);
    const sessionMap = await (0, studentEnrollment_helpers_1.getAcademicSessionEnrollmentMap)(studentIds, academicSession, academicSessionId);
    let schoolBoardSchoolIds;
    if (actor.accountType !== 'internal' && actor.role === 'school-board-admin' && actor.schoolBoardId) {
        const schools = await school_1.School.find({ schoolBoard: actor.schoolBoardId }).select('_id').lean();
        schoolBoardSchoolIds = new Set(schools.map((item) => item._id));
    }
    const serialized = students
        .map((student) => {
        const placement = (0, studentEnrollment_helpers_1.getEffectivePlacement)(student, sessionMap.get(student.id), currentMap.get(student.id));
        const placementWithGuardianIds = Object.assign(Object.assign({}, (placement || {})), { guardianIds: Array.isArray(student.guardianIds) ? student.guardianIds : [] });
        return {
            student,
            placement: placementWithGuardianIds,
        };
    })
        .filter(({ placement }) => canActorAccessPlacement(actor, placement, schoolBoardSchoolIds))
        .filter(({ placement }) => {
        if (school && (placement === null || placement === void 0 ? void 0 : placement.school) !== school) {
            return false;
        }
        if (classId && (placement === null || placement === void 0 ? void 0 : placement.classId) !== classId) {
            return false;
        }
        return true;
    })
        .map(({ student, placement }) => serializeStudent(student, placement));
    return paginateStudents(serialized, options);
};
exports.queryStudents = queryStudents;
const getStudentById = async (studentId, actor) => {
    assertStudentReadAccessRole(actor);
    const { student, placement } = await getStudentWithPlacement(studentId);
    const placementWithGuardianIds = Object.assign(Object.assign({}, (placement || {})), { guardianIds: student && Array.isArray(student.guardianIds) ? student.guardianIds : [] });
    if (!student || !canActorAccessPlacement(actor, placementWithGuardianIds)) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    return serializeStudent(student, placement);
};
exports.getStudentById = getStudentById;
const updateStudentById = async (studentId, updateBody, actor) => {
    assertStudentWriteAccessRole(actor);
    const { student, placement } = await getStudentWithPlacement(studentId);
    if (!student || !canActorAccessPlacement(actor, placement)) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    if (updateBody.regNumber) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'regNumber cannot be updated');
    }
    if (updateBody.school || updateBody.classId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Use promote endpoint to change school or class');
    }
    Object.assign(student, updateBody);
    await student.save();
    return serializeStudent(student, placement);
};
exports.updateStudentById = updateStudentById;
const promoteStudentById = async (studentId, payload, actor) => {
    assertStudentWriteAccessRole(actor);
    const { student, placement } = await getStudentWithPlacement(studentId);
    if (!student || !canActorAccessPlacement(actor, placement)) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    const nextSchoolId = payload.school || (placement === null || placement === void 0 ? void 0 : placement.school);
    if (!nextSchoolId) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'school is required to place this student');
    }
    const { school, classItem } = await validateSchoolAndClass(nextSchoolId, payload.classId, actor);
    if ((placement === null || placement === void 0 ? void 0 : placement.school) === school.id && (placement === null || placement === void 0 ? void 0 : placement.classId) === classItem.id) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Student is already in the selected class and school');
    }
    const enrollment = await (0, studentEnrollment_helpers_1.upsertStudentEnrollment)({
        studentId: student.id,
        schoolBoardId: school.schoolBoard || null,
        schoolId: school.id,
        classId: classItem.id,
    });
    return serializeStudent(student, enrollment);
};
exports.promoteStudentById = promoteStudentById;
const deleteStudentById = async (studentId, actor) => {
    assertStudentWriteAccessRole(actor);
    const { student, placement } = await getStudentWithPlacement(studentId);
    if (!student || !canActorAccessPlacement(actor, placement)) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    await studentEnrollment_model_1.default.deleteMany({ student: student.id });
    await student.deleteOne();
    return serializeStudent(student, placement);
};
exports.deleteStudentById = deleteStudentById;
//# sourceMappingURL=student.service.js.map