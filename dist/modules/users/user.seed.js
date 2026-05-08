"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInternalAdminUser = void 0;
const config_1 = __importDefault(require("../../config/config"));
const logger_1 = __importDefault(require("../logger/logger"));
const auth_model_1 = __importDefault(require("../auth/auth.model"));
const user_model_1 = __importDefault(require("./user.model"));
const getInternalAdminSeedConfig = ({ requireConfig = false } = {}) => {
    const { name, email, password } = config_1.default.internalAdminSeed;
    if (name && email && password) {
        return {
            name,
            email: email.toLowerCase(),
            password,
            role: 'super-admin',
        };
    }
    const hasPartialConfig = Boolean(name || email || password);
    if (hasPartialConfig && requireConfig) {
        throw new Error('Internal admin seed requires INTERNAL_ADMIN_NAME, INTERNAL_ADMIN_EMAIL, and INTERNAL_ADMIN_PASSWORD.');
    }
    if (hasPartialConfig) {
        logger_1.default.warn('Skipping internal admin seed because the configuration is incomplete.');
    }
    return null;
};
const seedInternalAdminUser = async (options = {}) => {
    const seedConfig = getInternalAdminSeedConfig(options);
    if (!seedConfig) {
        return { seeded: false };
    }
    const { name, email, password, role } = seedConfig;
    let user = await user_model_1.default.findOne({ email });
    if (!user) {
        user = await user_model_1.default.create({
            name,
            email,
            accountType: 'internal',
            role,
            isVerified: true,
            status: 'active',
        });
    }
    else {
        user.name = name;
        user.email = email;
        user.accountType = 'internal';
        user.role = role;
        user.isVerified = true;
        user.status = 'active';
        await user.save();
    }
    let auth = await auth_model_1.default.findOne({ email, provider: 'email' });
    if (!auth) {
        auth = await auth_model_1.default.create({
            user: user.id,
            email,
            password,
            provider: 'email',
        });
    }
    else {
        auth.user = user.id;
        auth.email = email;
        if (!(await auth.isPasswordMatch(password))) {
            auth.password = password;
        }
        await auth.save();
    }
    logger_1.default.info(`Internal admin user is ready for ${email}`);
    return {
        seeded: true,
        userId: user.id,
        email,
        role,
    };
};
exports.seedInternalAdminUser = seedInternalAdminUser;
//# sourceMappingURL=user.seed.js.map