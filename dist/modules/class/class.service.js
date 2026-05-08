"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClassById = exports.updateClassById = exports.getClassById = exports.queryClasses = exports.createClass = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_model_1 = __importDefault(require("../school/school.model"));
const school_type_1 = require("../school-type");
const student_model_1 = __importDefault(require("../student/student.model"));
const class_model_1 = __importDefault(require("./class.model"));
const resolveSchoolScope = async (actor, schoolId) => {
    let effectiveSchoolId = schoolId;
    if (actor.accountType !== 'internal') {
        if (actor.role === 'school-admin' || actor.role === 'teacher' || actor.role === 'staff') {
            if (!actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School context is missing for this user');
            }
            if (effectiveSchoolId && effectiveSchoolId !== actor.schoolId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot access classes for another school');
            }
            effectiveSchoolId = actor.schoolId;
        }
        if (actor.role === 'school-board-admin') {
            if (!actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
            }
            if (!effectiveSchoolId) {
                throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'schoolId is required for school-board-admin');
            }
            const school = await school_model_1.default.findById(effectiveSchoolId);
            if (!school || school.schoolBoard !== actor.schoolBoardId) {
                throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School is outside your school board');
            }
        }
    }
    if (!effectiveSchoolId) {
        return null;
    }
    const school = await school_model_1.default.findById(effectiveSchoolId);
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    return school.id;
};
const createClass = async (body) => {
    const schoolType = await school_type_1.SchoolType.findById(body.schoolTypeId);
    if (!schoolType) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School type not found');
    }
    const exists = await class_model_1.default.findOne({ code: body.code.toUpperCase(), schoolTypeId: body.schoolTypeId });
    if (exists) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Class code already exists for this school type');
    }
    return class_model_1.default.create(body);
};
exports.createClass = createClass;
const queryClasses = async (filter, options, actor, schoolId) => {
    const effectiveSchoolId = await resolveSchoolScope(actor, schoolId);
    if (!effectiveSchoolId) {
        return class_model_1.default.paginate(filter, options);
    }
    const studentCounts = await student_model_1.default.aggregate([
        { $match: { school: effectiveSchoolId, status: 'active' } },
        { $group: { _id: '$classId', studentCount: { $sum: 1 } } },
    ]);
    if (!studentCounts.length) {
        return {
            results: [],
            page: Number(options.page) || 1,
            limit: Number(options.limit) || 0,
            totalPages: 0,
            totalResults: 0,
        };
    }
    const studentCountByClassId = new Map(studentCounts.map((entry) => [String(entry._id), Number(entry.studentCount) || 0]));
    const scopedFilter = Object.assign(Object.assign({}, filter), { _id: { $in: [...studentCountByClassId.keys()] } });
    const paginated = await class_model_1.default.paginate(scopedFilter, options);
    return Object.assign(Object.assign({}, paginated), { results: paginated.results.map((classDoc) => {
            var _a;
            return (Object.assign(Object.assign({}, classDoc.toJSON()), { schoolId: effectiveSchoolId, studentCount: (_a = studentCountByClassId.get(classDoc.id)) !== null && _a !== void 0 ? _a : 0 }));
        }) });
};
exports.queryClasses = queryClasses;
const getClassById = async (classId) => {
    const found = await class_model_1.default.findById(classId);
    if (!found) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    return found;
};
exports.getClassById = getClassById;
const updateClassById = async (classId, updateBody) => {
    var _a, _b;
    const found = await (0, exports.getClassById)(classId);
    if (updateBody.code || updateBody.schoolTypeId) {
        const newCode = ((_a = updateBody.code) !== null && _a !== void 0 ? _a : found.code).toUpperCase();
        const newSchoolTypeId = (_b = updateBody.schoolTypeId) !== null && _b !== void 0 ? _b : found.schoolTypeId;
        const duplicate = await class_model_1.default.findOne({
            code: newCode,
            schoolTypeId: newSchoolTypeId,
            _id: { $ne: classId },
        });
        if (duplicate) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Class code already exists for this school type');
        }
    }
    Object.assign(found, updateBody);
    await found.save();
    return found;
};
exports.updateClassById = updateClassById;
const deleteClassById = async (classId) => {
    const found = await (0, exports.getClassById)(classId);
    await found.deleteOne();
    return found;
};
exports.deleteClassById = deleteClassById;
//# sourceMappingURL=class.service.js.map