"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchoolsBulk = exports.deleteSchoolById = exports.updateSchoolById = exports.getSchoolById = exports.querySchools = exports.createSchool = void 0;
const http_status_1 = __importDefault(require("http-status"));
const auth_1 = require("../auth");
const errors_1 = require("../errors");
const users_1 = require("../users");
const school_board_1 = require("../school-board");
const school_type_1 = require("../school-type");
const class_1 = require("../class");
const school_model_1 = __importDefault(require("./school.model"));
const normalizeAdminUserIds = (payload) => {
    const normalized = new Set();
    (payload.adminUsers || []).filter(Boolean).forEach((id) => normalized.add(id));
    if (payload.adminUser) {
        normalized.add(payload.adminUser);
    }
    if (payload.adminUserId) {
        normalized.add(payload.adminUserId);
    }
    return [...normalized];
};
const validateAndPrepareAdminUsers = async (schoolBoardId, adminUserIds) => {
    const validatedAdminUsers = [];
    for (const adminUserId of adminUserIds) {
        const adminUser = await users_1.userService.getUserById(adminUserId);
        if (!adminUser) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, `Assigned school admin user not found: ${adminUserId}`);
        }
        adminUser.accountType = 'client';
        adminUser.role = 'school-admin';
        adminUser.schoolBoardId = schoolBoardId;
        await adminUser.save();
        validatedAdminUsers.push(adminUser.id);
    }
    return validatedAdminUsers;
};
const buildSchoolAccessFilter = (actor) => {
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
        return { _id: actor.schoolId };
    }
    throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Only school board admin or school admin can access schools');
};
const resolveSchoolBoardIdForCreate = (payloadSchoolBoard, actor) => {
    const normalizedPayloadSchoolBoard = payloadSchoolBoard ? payloadSchoolBoard : null;
    if (actor.accountType === 'internal') {
        return normalizedPayloadSchoolBoard;
    }
    if (!actor.schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'School board context is missing for this user');
    }
    if (normalizedPayloadSchoolBoard && normalizedPayloadSchoolBoard !== actor.schoolBoardId) {
        throw new errors_1.ApiError(http_status_1.default.FORBIDDEN, 'Cannot create a school outside your school board');
    }
    return actor.schoolBoardId;
};
const resolveSchoolAdminUser = async (schoolBoardId, payload) => {
    if (payload.adminUserId && payload.admin) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Provide either adminUserId or admin payload, not both');
    }
    if (payload.adminUserId) {
        const adminUser = await users_1.userService.getUserById(payload.adminUserId);
        if (!adminUser) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Assigned school admin user not found');
        }
        adminUser.accountType = 'client';
        adminUser.role = 'school-admin';
        adminUser.schoolBoardId = schoolBoardId;
        await adminUser.save();
        return adminUser;
    }
    if (!payload.admin) {
        return null;
    }
    if (await auth_1.Auth.isEmailTaken(payload.admin.email)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School admin email already taken');
    }
    const adminUser = await users_1.userService.createUser(Object.assign({ name: payload.admin.name, email: payload.admin.email, accountType: 'client', role: 'school-admin', schoolBoardId, isVerified: true }, (payload.admin.phoneNumber ? { phoneNumber: payload.admin.phoneNumber } : {})));
    await auth_1.authService.createAuth({
        user: adminUser.id,
        email: payload.admin.email,
        password: payload.admin.password,
        provider: 'email',
    });
    return adminUser;
};
const resolveSchoolTypeAndClassSelection = async (schoolTypeIds, selectedClassIds) => {
    const normalizedSchoolTypeIds = [...new Set((schoolTypeIds || []).filter(Boolean))];
    if (normalizedSchoolTypeIds.length === 0) {
        return { schoolTypes: [], classes: [] };
    }
    const schoolTypes = await school_type_1.SchoolType.find({ _id: { $in: normalizedSchoolTypeIds } });
    if (schoolTypes.length !== normalizedSchoolTypeIds.length) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'One or more school types are invalid');
    }
    // If no specific classes selected, get all classes for the school types
    if (!selectedClassIds || selectedClassIds.length === 0) {
        const classes = await class_1.ClassModel.find({ schoolTypeId: { $in: normalizedSchoolTypeIds } });
        return {
            schoolTypes: normalizedSchoolTypeIds,
            classes: classes.map((item) => item.id),
        };
    }
    // If specific classes selected, validate they belong to the selected school types
    const normalizedClassIds = [...new Set(selectedClassIds.filter(Boolean))];
    const classes = await class_1.ClassModel.find({
        _id: { $in: normalizedClassIds },
        schoolTypeId: { $in: normalizedSchoolTypeIds }
    });
    if (classes.length !== normalizedClassIds.length) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'One or more selected classes do not belong to the selected school types');
    }
    return {
        schoolTypes: normalizedSchoolTypeIds,
        classes: normalizedClassIds,
    };
};
const createSchool = async (schoolBody, actor) => {
    var _a, _b;
    const schoolBoardId = resolveSchoolBoardIdForCreate(schoolBody.schoolBoard, actor);
    const schoolTypeSelection = await resolveSchoolTypeAndClassSelection(schoolBody.schoolTypes, schoolBody.classes);
    if (schoolBoardId) {
        const schoolBoard = await school_board_1.SchoolBoard.findById(schoolBoardId);
        if (!schoolBoard) {
            throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School board not found');
        }
    }
    const existingSchool = await school_model_1.default.findOne({ name: schoolBody.name, schoolBoard: schoolBoardId || null });
    if (existingSchool) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School already exists in this scope');
    }
    const adminUser = await resolveSchoolAdminUser(schoolBoardId, schoolBody);
    const requestedAdminUsers = normalizeAdminUserIds(schoolBody);
    const validatedAdminUsers = await validateAndPrepareAdminUsers(schoolBoardId, requestedAdminUsers);
    const allAdminUsers = [...new Set([...((adminUser === null || adminUser === void 0 ? void 0 : adminUser.id) ? [adminUser.id] : []), ...validatedAdminUsers])];
    const school = await school_model_1.default.create({
        name: schoolBody.name,
        schoolBoard: schoolBoardId || null,
        schoolTypes: schoolTypeSelection.schoolTypes,
        classes: schoolTypeSelection.classes,
        adminUser: (_b = (_a = allAdminUsers[0]) !== null && _a !== void 0 ? _a : adminUser === null || adminUser === void 0 ? void 0 : adminUser.id) !== null && _b !== void 0 ? _b : null,
        adminUsers: allAdminUsers,
        address: schoolBody.address,
        state: schoolBody.state,
        localGovernment: schoolBody.localGovernment,
        district: schoolBody.district,
        longitude: schoolBody.longitude,
        latitude: schoolBody.latitude,
        status: schoolBody.status,
    });
    if (adminUser) {
        adminUser.schoolId = school.id;
        await adminUser.save();
    }
    if (allAdminUsers.length > 0) {
        await users_1.User.updateMany({ _id: { $in: allAdminUsers } }, { $set: { schoolId: school.id } });
    }
    return school;
};
exports.createSchool = createSchool;
const querySchools = async (filter, options, actor) => {
    const accessFilter = buildSchoolAccessFilter(actor);
    return school_model_1.default.paginate(Object.assign(Object.assign({}, filter), accessFilter), options);
};
exports.querySchools = querySchools;
const getSchoolById = async (schoolId, actor) => {
    const accessFilter = buildSchoolAccessFilter(actor);
    const school = await school_model_1.default.findOne(Object.assign({ _id: schoolId }, accessFilter));
    if (!school) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'School not found');
    }
    return school;
};
exports.getSchoolById = getSchoolById;
const updateSchoolById = async (schoolId, updateBody, actor) => {
    var _a;
    const school = await (0, exports.getSchoolById)(schoolId, actor);
    if (updateBody.name) {
        const existingSchool = await school_model_1.default.findOne({
            _id: { $ne: schoolId },
            schoolBoard: school.schoolBoard || null,
            name: updateBody.name,
        });
        if (existingSchool) {
            throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'School name already exists in this school board');
        }
    }
    if (updateBody.schoolTypes) {
        const schoolTypeSelection = await resolveSchoolTypeAndClassSelection(updateBody.schoolTypes, updateBody.classes || school.classes);
        updateBody.schoolTypes = schoolTypeSelection.schoolTypes;
        updateBody.classes = schoolTypeSelection.classes;
    }
    if (updateBody.adminUsers || updateBody.adminUser !== undefined) {
        const requestedAdminUsers = normalizeAdminUserIds(Object.assign(Object.assign({}, (updateBody.adminUsers ? { adminUsers: updateBody.adminUsers } : {})), (updateBody.adminUser !== undefined ? { adminUser: updateBody.adminUser } : {})));
        const validatedAdminUsers = await validateAndPrepareAdminUsers(school.schoolBoard || null, requestedAdminUsers);
        updateBody.adminUsers = validatedAdminUsers;
        updateBody.adminUser = (_a = validatedAdminUsers[0]) !== null && _a !== void 0 ? _a : null;
        if (validatedAdminUsers.length > 0) {
            await users_1.User.updateMany({ _id: { $in: validatedAdminUsers } }, { $set: { schoolId: school.id } });
        }
    }
    Object.assign(school, updateBody);
    await school.save();
    return school;
};
exports.updateSchoolById = updateSchoolById;
const deleteSchoolById = async (schoolId, actor) => {
    const school = await (0, exports.getSchoolById)(schoolId, actor);
    await school.deleteOne();
    await users_1.User.updateMany({ schoolId: school.id }, { $set: { schoolId: null } });
    return school;
};
exports.deleteSchoolById = deleteSchoolById;
const createSchoolsBulk = async (schools, actor) => {
    const created = [];
    const failed = [];
    for (const [index, payload] of schools.entries()) {
        try {
            const school = await (0, exports.createSchool)(payload, actor);
            created.push(school);
        }
        catch (error) {
            failed.push({
                row: index + 1,
                name: payload.name,
                reason: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    return {
        total: schools.length,
        createdCount: created.length,
        failedCount: failed.length,
        created,
        failed,
    };
};
exports.createSchoolsBulk = createSchoolsBulk;
//# sourceMappingURL=school.service.js.map