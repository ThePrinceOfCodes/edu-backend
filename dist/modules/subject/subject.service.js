"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubjectById = exports.updateSubjectById = exports.getSubjectById = exports.querySubjects = exports.createSubject = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const subject_model_1 = __importDefault(require("./subject.model"));
const createSubject = async (body) => {
    const normalizedName = body.name.trim();
    const normalizedCode = body.code.trim().toUpperCase();
    const [nameExists, codeExists] = await Promise.all([
        subject_model_1.default.findOne({ name: normalizedName }),
        subject_model_1.default.findOne({ code: normalizedCode }),
    ]);
    if (nameExists) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Subject name already exists');
    }
    if (codeExists) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Subject code already exists');
    }
    return subject_model_1.default.create({ name: normalizedName, code: normalizedCode });
};
exports.createSubject = createSubject;
const querySubjects = async (filter, options) => {
    const nextFilter = Object.assign(Object.assign({}, filter), (filter.code ? { code: String(filter.code).toUpperCase() } : {}));
    const nextOptions = Object.assign({ sortBy: options.sortBy || 'name:asc' }, options);
    return subject_model_1.default.paginate(nextFilter, nextOptions);
};
exports.querySubjects = querySubjects;
const getSubjectById = async (subjectId) => {
    const subject = await subject_model_1.default.findById(subjectId);
    if (!subject) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Subject not found');
    }
    return subject;
};
exports.getSubjectById = getSubjectById;
const updateSubjectById = async (subjectId, updateBody) => {
    const subject = await (0, exports.getSubjectById)(subjectId);
    if (updateBody.name) {
        const normalizedName = updateBody.name.trim();
        const nameExists = await subject_model_1.default.findOne({ name: normalizedName, _id: { $ne: subjectId } });
        if (nameExists) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Subject name already exists');
        }
        subject.name = normalizedName;
    }
    if (updateBody.code) {
        const normalizedCode = updateBody.code.trim().toUpperCase();
        const codeExists = await subject_model_1.default.findOne({ code: normalizedCode, _id: { $ne: subjectId } });
        if (codeExists) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Subject code already exists');
        }
        subject.code = normalizedCode;
    }
    await subject.save();
    return subject;
};
exports.updateSubjectById = updateSubjectById;
const deleteSubjectById = async (subjectId) => {
    const subject = await (0, exports.getSubjectById)(subjectId);
    await subject.deleteOne();
    return subject;
};
exports.deleteSubjectById = deleteSubjectById;
//# sourceMappingURL=subject.service.js.map