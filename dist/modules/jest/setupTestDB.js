"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("../../config/config"));
const setupTestDB = () => {
    beforeAll(async () => {
        await mongoose_1.default.connect(config_1.default.mongoose.url);
    });
    beforeEach(async () => {
        await Promise.all(Object.values(mongoose_1.default.connection.collections).map(async (collection) => collection.deleteMany({})));
    });
    afterAll(async () => {
        await mongoose_1.default.disconnect();
    });
};
exports.default = setupTestDB;
//# sourceMappingURL=setupTestDB.js.map