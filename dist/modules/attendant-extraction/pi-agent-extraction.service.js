"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairAttendanceJsonWithPi = exports.extractAttendanceWithPi = exports.resolvePiModel = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const config_1 = __importDefault(require("../../config/config"));
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const pi_oauth_service_1 = require("./pi-oauth.service");
const prompts_1 = require("./prompts");
const resolvePiModel = async (modelRegistry) => {
    const configuredProvider = config_1.default.attendanceExtraction.provider;
    const configuredModel = config_1.default.attendanceExtraction.model;
    if (configuredProvider && configuredModel) {
        const explicitModel = modelRegistry.find(configuredProvider, configuredModel);
        if (!explicitModel) {
            throw new errors_1.ApiError(500, `Configured Pi model '${configuredProvider}/${configuredModel}' was not found`);
        }
        return explicitModel;
    }
    const oauthProvider = (0, pi_oauth_service_1.getRuntimePiOAuthProviderId)();
    if (oauthProvider === 'openai-codex') {
        const codexModel = modelRegistry.find('openai-codex', 'gpt-5.3-codex');
        if (!codexModel) {
            throw new errors_1.ApiError(500, "Configured Pi model 'openai-codex/gpt-5.3-codex' was not found");
        }
        return codexModel;
    }
    const availableModels = modelRegistry.getAvailable().filter((model) => Array.isArray(model.input) && model.input.includes('image'));
    const providerFilteredModels = configuredProvider
        ? availableModels.filter((model) => model.provider === configuredProvider)
        : availableModels;
    const selectedModel = providerFilteredModels[0];
    if (!selectedModel) {
        throw new errors_1.ApiError(500, 'No vision-capable Pi model is available with configured backend API keys');
    }
    return selectedModel;
};
exports.resolvePiModel = resolvePiModel;
const createPrompt = (_input) => {
    return `${prompts_1.ATTENDANCE_EXTRACTION_PROMPT}`;
};
const createImagePayload = async (imagePath, mimeType) => {
    const imageBuffer = await promises_1.default.readFile(imagePath);
    return {
        type: 'image',
        data: imageBuffer.toString('base64'),
        mimeType,
    };
};
const loadPiSdk = async () => new Function('return import("@earendil-works/pi-coding-agent")')();
const createPiSession = async () => {
    const sdk = await loadPiSdk();
    const authStorage = sdk.AuthStorage.create();
    const oauthKey = await (0, pi_oauth_service_1.getPiOAuthApiKey)();
    const oauthProvider = (0, pi_oauth_service_1.getRuntimePiOAuthProviderId)();
    const preferredProvider = config_1.default.attendanceExtraction.provider;
    const isOpenAiMode = preferredProvider === 'openai';
    if (!isOpenAiMode && oauthKey && oauthProvider) {
        authStorage.setRuntimeApiKey(oauthProvider, oauthKey);
        logger_1.logger.debug(`[pi-agent] Using Pi OAuth key for provider '${oauthProvider}'`);
    }
    const { openai } = config_1.default.attendanceExtraction.apiKeys;
    if (openai)
        authStorage.setRuntimeApiKey('openai', openai);
    const modelRegistry = sdk.ModelRegistry.create(authStorage);
    const model = await (0, exports.resolvePiModel)(modelRegistry);
    const { session } = await sdk.createAgentSession({
        sessionManager: sdk.SessionManager.inMemory(process.cwd()),
        authStorage,
        modelRegistry,
        model,
        allowedToolNames: [],
    });
    return { session, model };
};
const extractAssistantText = (session) => {
    var _a, _b, _c, _d, _e;
    const lastAssistant = (_b = (_a = session.state) === null || _a === void 0 ? void 0 : _a.messages) === null || _b === void 0 ? void 0 : _b.slice().reverse().find((message) => message.role === 'assistant');
    const fromState = (_d = (_c = lastAssistant === null || lastAssistant === void 0 ? void 0 : lastAssistant.content) === null || _c === void 0 ? void 0 : _c.find((item) => item.type === 'text')) === null || _d === void 0 ? void 0 : _d.text;
    return ((_e = session.getLastAssistantText) === null || _e === void 0 ? void 0 : _e.call(session)) || fromState;
};
const promptPiSession = async (session, prompt, imagePath, mimeType) => {
    const imagePayload = await createImagePayload(imagePath, mimeType);
    await Promise.race([
        session.prompt(prompt, {
            images: [imagePayload],
        }),
        new Promise((_, reject) => {
            setTimeout(() => reject(new errors_1.ApiError(504, 'Vision LLM request timed out after 120000ms')), 120000);
        }),
    ]);
    const responseText = extractAssistantText(session);
    if (!responseText) {
        throw new errors_1.ApiError(504, 'Vision LLM returned an empty response');
    }
    return responseText;
};
const extractAttendanceWithPi = async (input) => {
    const { session, model } = await createPiSession();
    try {
        logger_1.logger.info(`[pi-agent] Running attendant extraction with ${model.provider}/${model.id}`);
        const responseText = await promptPiSession(session, createPrompt(input), input.imagePath, input.mimeType);
        return {
            rawResponse: responseText,
            provider: model.provider,
            model: model.id,
            promptVersion: prompts_1.ATTENDANCE_EXTRACTION_PROMPT_VERSION,
        };
    }
    finally {
        session.dispose();
    }
};
exports.extractAttendanceWithPi = extractAttendanceWithPi;
const repairAttendanceJsonWithPi = async (rawResponse, input) => {
    logger_1.logger.warn('Retrying attendant extraction with JSON repair prompt');
    const repairPrompt = `${prompts_1.ATTENDANCE_EXTRACTION_REPAIR_PROMPT}\n\nPrevious response:\n${rawResponse}`;
    const { session } = await createPiSession();
    try {
        return await promptPiSession(session, repairPrompt, input.imagePath, input.mimeType);
    }
    finally {
        session.dispose();
    }
};
exports.repairAttendanceJsonWithPi = repairAttendanceJsonWithPi;
//# sourceMappingURL=pi-agent-extraction.service.js.map