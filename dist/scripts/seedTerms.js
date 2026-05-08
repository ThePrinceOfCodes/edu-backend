"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = __importDefault(require("../modules/logger/logger"));
const schoolBoard_model_1 = __importDefault(require("../modules/school-board/schoolBoard.model"));
const term_model_1 = __importDefault(require("../modules/term/term.model"));
const toUtcDate = (year, monthIndex, day) => new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));
const getAcademicSessionStartYear = (referenceDate) => {
    const month = referenceDate.getUTCMonth();
    const year = referenceDate.getUTCFullYear();
    return month >= 8 ? year : year - 1;
};
const buildAcademicSession = (startYear) => `${startYear}/${startYear + 1}`;
const buildTermName = (academicSession, termName, startDate, endDate) => {
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);
    return `${academicSession} ${termName} (${start} - ${end})`;
};
const buildTermDefinitions = (sessionStartYear) => [
    {
        termName: 'First Term',
        startDate: toUtcDate(sessionStartYear, 8, 8),
        endDate: toUtcDate(sessionStartYear, 11, 19),
    },
    {
        termName: 'Second Term',
        startDate: toUtcDate(sessionStartYear + 1, 0, 12),
        endDate: toUtcDate(sessionStartYear + 1, 3, 10),
    },
    {
        termName: 'Third Term',
        startDate: toUtcDate(sessionStartYear + 1, 3, 27),
        endDate: toUtcDate(sessionStartYear + 1, 6, 24),
    },
];
const isDateWithinRange = (referenceDate, startDate, endDate) => referenceDate >= startDate && referenceDate <= endDate;
const run = async () => {
    const now = new Date();
    const sessionStartYear = getAcademicSessionStartYear(now);
    const academicSession = buildAcademicSession(sessionStartYear);
    const termDefinitions = buildTermDefinitions(sessionStartYear);
    let createdCount = 0;
    let updatedCount = 0;
    try {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
        logger_1.default.info(`Connected to MongoDB for term seed (${academicSession})`);
        const schoolBoards = await schoolBoard_model_1.default.find({ status: 'active' });
        if (!schoolBoards.length) {
            throw new Error('No active school boards found. Seed school boards before seeding terms.');
        }
        for (const schoolBoard of schoolBoards) {
            for (const definition of termDefinitions) {
                const isActive = isDateWithinRange(now, definition.startDate, definition.endDate);
                const name = buildTermName(academicSession, definition.termName, definition.startDate, definition.endDate);
                const existing = await term_model_1.default.findOne({
                    schoolBoard: schoolBoard.id,
                    school: null,
                    termName: definition.termName,
                    academicSession,
                });
                if (existing) {
                    existing.name = name;
                    existing.startDate = definition.startDate;
                    existing.endDate = definition.endDate;
                    existing.isActive = isActive;
                    await existing.save();
                    updatedCount += 1;
                }
                else {
                    await term_model_1.default.create({
                        name,
                        termName: definition.termName,
                        academicSession,
                        schoolBoard: schoolBoard.id,
                        school: null,
                        startDate: definition.startDate,
                        endDate: definition.endDate,
                        isActive,
                    });
                    createdCount += 1;
                }
            }
            const activeTermNames = termDefinitions
                .filter((definition) => isDateWithinRange(now, definition.startDate, definition.endDate))
                .map((definition) => definition.termName);
            await term_model_1.default.updateMany({
                schoolBoard: schoolBoard.id,
                school: null,
                academicSession,
                termName: { $nin: activeTermNames },
                isActive: true,
            }, { $set: { isActive: false } });
        }
        logger_1.default.info(`Terms seeded successfully for ${schoolBoards.length} school boards. Created: ${createdCount}, updated: ${updatedCount}`);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
};
run()
    .then(() => {
    logger_1.default.info('Term seed completed');
    process.exit(0);
})
    .catch((error) => {
    logger_1.default.error(error.message);
    process.exit(1);
});
//# sourceMappingURL=seedTerms.js.map