"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const schoolBoard_model_1 = __importDefault(require("../modules/school-board/schoolBoard.model"));
const academicSession_model_1 = __importDefault(require("../modules/academic-session/academicSession.model"));
const run = async () => {
    try {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
        logger_1.default.info('Connected to MongoDB');
        const schoolBoards = await schoolBoard_model_1.default.find().lean();
        logger_1.default.info(`Found ${schoolBoards.length} school boards`);
        if (schoolBoards.length === 0) {
            logger_1.default.warn('No school boards found. Please create school boards first.');
            await mongoose_1.default.disconnect();
            return;
        }
        const currentYear = new Date().getUTCFullYear();
        const startYear = 2010;
        let totalCreated = 0;
        let totalSkipped = 0;
        for (const schoolBoard of schoolBoards) {
            for (let year = startYear; year <= currentYear; year += 1) {
                const endYear = year + 1;
                const sessionName = `${year}/${endYear}`;
                const exists = await academicSession_model_1.default.findOne({
                    schoolBoard: schoolBoard._id,
                    startYear: year,
                    endYear,
                });
                if (exists) {
                    totalSkipped += 1;
                    continue;
                }
                const now = new Date();
                const sessionStart = new Date(Date.UTC(year, 8, 1));
                const sessionEnd = new Date(Date.UTC(endYear, 7, 31, 23, 59, 59, 999));
                const isActive = sessionStart <= now && sessionEnd >= now;
                await academicSession_model_1.default.create({
                    _id: (0, uuid_1.v4)(),
                    name: sessionName,
                    startYear: year,
                    endYear,
                    schoolBoard: schoolBoard._id,
                    isActive,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                totalCreated += 1;
            }
        }
        logger_1.default.info(`✓ Migration complete: ${totalCreated} sessions created, ${totalSkipped} already existed`);
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        logger_1.default.error('Migration failed:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
};
run();
//# sourceMappingURL=addHistoricalAcademicSessions.js.map