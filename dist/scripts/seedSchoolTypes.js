"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const school_type_1 = require("../modules/school-type");
const SCHOOL_TYPE_NAMES = ['Nursery', 'Primary', 'Junior Secondary', 'Senior Secondary'];
const run = async () => {
    try {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
        logger_1.default.info('Connected to MongoDB for school type seed');
        for (const name of SCHOOL_TYPE_NAMES) {
            await school_type_1.SchoolType.findOneAndUpdate({ name }, { $set: { name } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
        logger_1.default.info('School types seeded successfully');
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
run()
    .then(() => {
    logger_1.default.info('School type seed completed');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error(error.message);
    process.exit(1);
});
//# sourceMappingURL=seedSchoolTypes.js.map