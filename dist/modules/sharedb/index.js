"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedb = void 0;
const config_1 = __importDefault(require("../../config/config"));
const sharedb_1 = __importDefault(require("sharedb"));
const sharedb_mongo_1 = __importDefault(require("sharedb-mongo"));
const mongoUrl = config_1.default.shareDbUrl; // Replace with your MongoDB connection string
const db = new sharedb_mongo_1.default(mongoUrl);
exports.sharedb = new sharedb_1.default({ db }); // Use the default MongoDB database
//# sourceMappingURL=index.js.map