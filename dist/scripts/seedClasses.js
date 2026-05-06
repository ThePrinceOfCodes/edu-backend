"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const school_type_1 = require("../modules/school-type");
const class_1 = require("../modules/class");
const CLASS_SEED_DATA = [
    { schoolTypeName: 'Nursery', name: 'Creche', code: 'CRE' },
    { schoolTypeName: 'Nursery', name: 'KG 1', code: 'KG1' },
    { schoolTypeName: 'Nursery', name: 'KG 2', code: 'KG2' },
    { schoolTypeName: 'Primary', name: 'Primary 1', code: 'P1' },
    { schoolTypeName: 'Primary', name: 'Primary 2', code: 'P2' },
    { schoolTypeName: 'Primary', name: 'Primary 3', code: 'P3' },
    { schoolTypeName: 'Primary', name: 'Primary 4', code: 'P4' },
    { schoolTypeName: 'Primary', name: 'Primary 5', code: 'P5' },
    { schoolTypeName: 'Primary', name: 'Primary 6', code: 'P6' },
    {
        schoolTypeName: 'Junior Secondary',
        name: 'JSS 1',
        code: 'JSS1',
    },
    {
        schoolTypeName: 'Junior Secondary',
        name: 'JSS 2',
        code: 'JSS2',
    },
    {
        schoolTypeName: 'Junior Secondary',
        name: 'JSS 3',
        code: 'JSS3',
    },
    {
        schoolTypeName: 'Senior Secondary',
        name: 'SS 1',
        code: 'SS1',
    },
    {
        schoolTypeName: 'Senior Secondary',
        name: 'SS 2',
        code: 'SS2',
    },
    {
        schoolTypeName: 'Senior Secondary',
        name: 'SS 3',
        code: 'SS3',
    },
];
const run = async () => {
    try {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
        logger_1.default.info('Connected to MongoDB for class seed');
        const schoolTypes = await school_type_1.SchoolType.find({
            name: { $in: ['Nursery', 'Primary', 'Junior Secondary', 'Senior Secondary'] },
        });
        const schoolTypeMap = new Map(schoolTypes.map((item) => [item.name, item.id]));
        for (const record of CLASS_SEED_DATA) {
            const schoolTypeId = schoolTypeMap.get(record.schoolTypeName);
            if (!schoolTypeId) {
                throw new Error(`Missing school type: ${record.schoolTypeName}. Run seed:school-types first.`);
            }
            await class_1.ClassModel.findOneAndUpdate({ schoolTypeId, code: record.code }, {
                $set: {
                    name: record.name,
                    code: record.code,
                    schoolTypeId,
                },
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
        logger_1.default.info('Classes seeded successfully');
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
run()
    .then(() => {
    logger_1.default.info('Class seed completed');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error(error.message);
    process.exit(1);
});
//# sourceMappingURL=seedClasses.js.map