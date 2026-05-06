"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClassById = exports.updateClassById = exports.getClassById = exports.queryClasses = exports.createClass = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const school_type_1 = require("../school-type");
const class_model_1 = __importDefault(require("./class.model"));
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
const queryClasses = async (filter, options) => {
    return class_model_1.default.paginate(filter, options);
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