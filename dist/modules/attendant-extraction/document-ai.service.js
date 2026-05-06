"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDocument = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const documentai_1 = require("@google-cloud/documentai");
const config_1 = __importDefault(require("../../config/config"));
const client = new documentai_1.DocumentProcessorServiceClient();
const mimeTypeFromPath = (filePath) => {
    var _a;
    const ext = path_1.default.extname(filePath).toLowerCase();
    const map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
        '.pdf': 'application/pdf',
    };
    return (_a = map[ext]) !== null && _a !== void 0 ? _a : 'image/jpeg';
};
const processDocument = async (filePath, mimeType) => {
    const resolvedMimeType = mimeType !== null && mimeType !== void 0 ? mimeType : mimeTypeFromPath(filePath);
    if (!config_1.default.googleDocumentAi.projectId || !config_1.default.googleDocumentAi.location || !config_1.default.googleDocumentAi.processorId) {
        throw new Error('Google Document AI config is missing');
    }
    const name = `projects/${config_1.default.googleDocumentAi.projectId}/locations/${config_1.default.googleDocumentAi.location}/processors/${config_1.default.googleDocumentAi.processorId}`;
    const file = await promises_1.default.readFile(filePath);
    const encodedImage = Buffer.from(file).toString('base64');
    const request = {
        name,
        rawDocument: {
            content: encodedImage,
            mimeType: resolvedMimeType,
        },
    };
    const [result] = await client.processDocument(request, {
        timeout: 600000,
    });
    return result.document;
};
exports.processDocument = processDocument;
//# sourceMappingURL=document-ai.service.js.map