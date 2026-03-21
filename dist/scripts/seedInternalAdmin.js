"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const user_seed_1 = require("../modules/users/user.seed");
const run = async () => {
    try {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
        logger_1.default.info('Connected to MongoDB for internal admin seed');
        const result = await (0, user_seed_1.seedInternalAdminUser)({ requireConfig: true });
        if (!result.seeded) {
            throw new Error('Internal admin seed configuration is missing.');
        }
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
run()
    .then(() => {
    logger_1.default.info('Internal admin seed completed');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error(error.message);
    process.exit(1);
});
//# sourceMappingURL=seedInternalAdmin.js.map