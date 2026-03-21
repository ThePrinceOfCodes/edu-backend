"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryUsers = exports.getUserByEmail = exports.getUserById = exports.createUser = void 0;
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
//# sourceMappingURL=user.service.js.map