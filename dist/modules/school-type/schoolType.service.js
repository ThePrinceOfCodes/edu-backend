"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchoolTypeById = exports.updateSchoolTypeById = exports.getSchoolTypeById = exports.querySchoolTypes = exports.createSchoolType = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const schoolType_model_1 = __importDefault(require("./schoolType.model"));
const createSchoolType = async (body) => {
    const exists = await schoolType_model_1.default.findOne({ name: body.name });
    if (exists) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School type name already exists');
    }
    return schoolType_model_1.default.create(body);
};
exports.createSchoolType = createSchoolType;
const querySchoolTypes = async (filter, options) => {
    return schoolType_model_1.default.paginate(filter, options);
};
exports.querySchoolTypes = querySchoolTypes;
const getSchoolTypeById = async (schoolTypeId) => {
    const schoolType = await schoolType_model_1.default.findById(schoolTypeId);
    if (!schoolType) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School type not found');
    }
    return schoolType;
};
exports.getSchoolTypeById = getSchoolTypeById;
const updateSchoolTypeById = async (schoolTypeId, updateBody) => {
    const schoolType = await (0, exports.getSchoolTypeById)(schoolTypeId);
    if (updateBody.name) {
        const exists = await schoolType_model_1.default.findOne({ name: updateBody.name, _id: { $ne: schoolTypeId } });
        if (exists) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School type name already exists');
        }
    }
    Object.assign(schoolType, updateBody);
    await schoolType.save();
    return schoolType;
};
exports.updateSchoolTypeById = updateSchoolTypeById;
const deleteSchoolTypeById = async (schoolTypeId) => {
    const schoolType = await (0, exports.getSchoolTypeById)(schoolTypeId);
    await schoolType.deleteOne();
    return schoolType;
};
exports.deleteSchoolTypeById = deleteSchoolTypeById;
//# sourceMappingURL=schoolType.service.js.map