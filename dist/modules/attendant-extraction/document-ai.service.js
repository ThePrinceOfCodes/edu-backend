"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDocumentAiLayoutSummary = exports.isDocumentAiInvalidArgumentError = exports.processDocument = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const documentai_1 = require("@google-cloud/documentai");
const config_1 = __importDefault(require("../../config/config"));
const buildClient = () => {
    const sa = config_1.default.googleServiceAccount;
    if (sa.clientEmail && sa.privateKey) {
        return new documentai_1.DocumentProcessorServiceClient({
            credentials: {
                type: sa.type,
                project_id: sa.projectId,
                private_key_id: sa.privateKeyId,
                private_key: sa.privateKey,
                client_email: sa.clientEmail,
                client_id: sa.clientId,
                token_uri: sa.tokenUri,
                auth_provider_x509_cert_url: sa.authProviderCertUrl,
                client_x509_cert_url: sa.clientCertUrl,
                universe_domain: sa.universeDomain,
            },
            projectId: config_1.default.googleDocumentAi.projectId,
        });
    }
    // Fallback to Application Default Credentials (useful in GCP-hosted environments)
    return new documentai_1.DocumentProcessorServiceClient();
};
const client = buildClient();
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
    const fileMimeType = mimeTypeFromPath(filePath);
    const resolvedMimeType = fileMimeType || mimeType || 'image/jpeg';
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
    const [result] = await Promise.race([
        client.processDocument(request, {
            timeout: 120000,
        }),
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Document AI request timed out after 120000ms')), 120000);
        }),
    ]);
    return result.document;
};
exports.processDocument = processDocument;
const isDocumentAiInvalidArgumentError = (error) => {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('INVALID_ARGUMENT') || message.includes('Request contains an invalid argument');
};
exports.isDocumentAiInvalidArgumentError = isDocumentAiInvalidArgumentError;
const buildDocumentAiLayoutSummary = (document) => {
    const pages = Array.isArray(document === null || document === void 0 ? void 0 : document.pages) ? document.pages : [];
    const entities = Array.isArray(document === null || document === void 0 ? void 0 : document.entities) ? document.entities : [];
    const formFields = pages.reduce((count, page) => { var _a; return count + (((_a = page === null || page === void 0 ? void 0 : page.formFields) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
    const tables = pages.reduce((count, page) => { var _a; return count + (((_a = page === null || page === void 0 ? void 0 : page.tables) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
    return {
        pageCount: pages.length,
        textLength: typeof (document === null || document === void 0 ? void 0 : document.text) === 'string' ? document.text.length : 0,
        formFieldCount: formFields,
        tableCount: tables,
        entityMentions: entities.slice(0, 25).map((entity) => ({
            type: (entity === null || entity === void 0 ? void 0 : entity.type) || '',
            mentionText: (entity === null || entity === void 0 ? void 0 : entity.mentionText) || '',
            confidence: typeof (entity === null || entity === void 0 ? void 0 : entity.confidence) === 'number' ? entity.confidence : null,
        })),
    };
};
exports.buildDocumentAiLayoutSummary = buildDocumentAiLayoutSummary;
//# sourceMappingURL=document-ai.service.js.map