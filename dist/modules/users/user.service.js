"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteUserById = exports.deactivateUserById = exports.updateUserById = exports.queryUsers = exports.getUserByEmail = exports.getUserById = exports.createUser = void 0;
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = __importDefault(require("./user.model"));
const index_1 = require("../errors/index");
const auth_model_1 = __importDefault(require("../auth/auth.model"));
const createUser = async (userBody) => {
    if (await auth_model_1.default.isEmailTaken(userBody.email)) {
        throw new index_1.ApiError(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    return user_model_1.default.create(userBody);
};
exports.createUser = createUser;
const getUserById = async (id) => {
    return user_model_1.default.findById(id);
};
exports.getUserById = getUserById;
const getUserByEmail = async (email) => {
    return user_model_1.default.findOne({ email });
};
exports.getUserByEmail = getUserByEmail;
const queryUsers = async (filter, options) => {
    const users = await user_model_1.default.paginate(filter, options);
    return users;
};
exports.queryUsers = queryUsers;
const updateUserById = async (userId, updateBody) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user) {
        throw new index_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && updateBody.email !== user.email && (await auth_model_1.default.isEmailTaken(updateBody.email, user.id))) {
        throw new index_1.ApiError(http_status_1.default.BAD_REQUEST, 'Email already taken');
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
};
exports.updateUserById = updateUserById;
const deactivateUserById = async (userId) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user) {
        throw new index_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
    }
    user.status = 'disabled';
    await user.save();
    return user;
};
exports.deactivateUserById = deactivateUserById;
const softDeleteUserById = async (userId) => {
    const user = await (0, exports.getUserById)(userId);
    if (!user) {
        throw new index_1.ApiError(http_status_1.default.NOT_FOUND, 'User not found');
    }
    user.status = 'disabled';
    user.permissions = [];
    await user.save();
    const auth = await auth_model_1.default.findOne({ user: user.id, provider: 'email' });
    if (auth) {
        auth.email = `deleted+${user.id}@deleted.local`;
        await auth.save();
    }
    user.email = `deleted+${user.id}@deleted.local`;
    user.name = `${user.name} (deleted)`;
    await user.save();
    return user;
};
exports.softDeleteUserById = softDeleteUserById;
//# sourceMappingURL=user.service.js.map