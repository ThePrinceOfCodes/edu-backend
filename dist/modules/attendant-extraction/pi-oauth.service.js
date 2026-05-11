"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPiOAuthApiKey = exports.getRuntimePiOAuthProviderId = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = __importDefault(require("../../config/config"));
const logger_1 = require("../logger");
const CACHE_PATH = (0, path_1.join)(process.cwd(), '.pi-oauth-cache.json');
const OPENAI_CODEX_PROVIDER_ID = 'openai-codex';
const OPENAI_CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OPENAI_CODEX_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const readCache = () => {
    try {
        if ((0, fs_1.existsSync)(CACHE_PATH)) {
            const parsed = JSON.parse((0, fs_1.readFileSync)(CACHE_PATH, 'utf-8'));
            return Object.fromEntries(Object.entries(parsed)
                .map(([provider, credentials]) => [provider, normalizeCredentials(credentials)])
                .filter((entry) => entry[1] !== null));
        }
    }
    catch (_a) {
    }
    return {};
};
const normalizeCredentials = (credentials) => {
    var _a, _b, _c;
    const access = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.access) !== null && _a !== void 0 ? _a : credentials === null || credentials === void 0 ? void 0 : credentials.accessToken;
    const refresh = (_b = credentials === null || credentials === void 0 ? void 0 : credentials.refresh) !== null && _b !== void 0 ? _b : credentials === null || credentials === void 0 ? void 0 : credentials.refreshToken;
    const expires = (_c = credentials === null || credentials === void 0 ? void 0 : credentials.expires) !== null && _c !== void 0 ? _c : credentials === null || credentials === void 0 ? void 0 : credentials.expiresAt;
    if (!access || !refresh || typeof expires !== 'number') {
        return null;
    }
    return {
        type: 'oauth',
        access,
        refresh,
        expires,
    };
};
const writeCache = (store) => {
    var _a;
    try {
        (0, fs_1.writeFileSync)(CACHE_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
    }
    catch (err) {
        logger_1.logger.warn(`[pi-oauth] Could not write token cache: ${(_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : err}`);
    }
};
const buildAuthStore = () => {
    const provider = (0, exports.getRuntimePiOAuthProviderId)();
    const { accessToken, refreshToken, expiresAt } = config_1.default.piOAuth;
    if (!provider)
        return null;
    const fromEnv = normalizeCredentials(Object.assign(Object.assign(Object.assign({ type: 'oauth' }, (accessToken ? { access: accessToken } : {})), (refreshToken ? { refresh: refreshToken } : {})), (typeof expiresAt === 'number' ? { expires: expiresAt } : {})));
    if (!fromEnv) {
        logger_1.logger.warn('[pi-oauth] PI_OAUTH_ACCESS_TOKEN, PI_OAUTH_REFRESH_TOKEN, and PI_OAUTH_EXPIRES_AT must all be set');
        return null;
    }
    const cache = readCache();
    const cached = normalizeCredentials(cache[provider]);
    const merged = cached ? Object.assign(Object.assign({}, fromEnv), cached) : fromEnv;
    return { [provider]: merged };
};
const getRuntimePiOAuthProviderId = () => {
    var _a;
    const provider = (_a = config_1.default.piOAuth.provider) === null || _a === void 0 ? void 0 : _a.trim();
    if (!provider)
        return null;
    if (provider === 'open-codex')
        return OPENAI_CODEX_PROVIDER_ID;
    return provider;
};
exports.getRuntimePiOAuthProviderId = getRuntimePiOAuthProviderId;
const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await fetch(OPENAI_CODEX_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: OPENAI_CODEX_CLIENT_ID,
            }),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            return {
                type: 'failed',
                status: response.status,
                message: `OpenAI Codex token refresh failed (${response.status}): ${text || response.statusText}`,
            };
        }
        const json = (await response.json());
        if (!json.access_token || !json.refresh_token || typeof json.expires_in !== 'number') {
            return {
                type: 'failed',
                message: `OpenAI Codex token refresh response missing fields: ${JSON.stringify(json)}`,
            };
        }
        return {
            type: 'success',
            access: json.access_token,
            refresh: json.refresh_token,
            expires: Date.now() + json.expires_in * 1000,
        };
    }
    catch (error) {
        return {
            type: 'failed',
            message: `OpenAI Codex token refresh error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
const getPiOAuthApiKey = async () => {
    var _a;
    const provider = (0, exports.getRuntimePiOAuthProviderId)();
    if (!provider)
        return null;
    const authStore = buildAuthStore();
    if (!authStore)
        return null;
    try {
        const updatedCache = readCache();
        const current = authStore[provider];
        if (provider !== OPENAI_CODEX_PROVIDER_ID) {
            logger_1.logger.warn(`[pi-oauth] Unsupported OAuth provider '${provider}'`);
            return null;
        }
        if (!current) {
            logger_1.logger.warn(`[pi-oauth] No OAuth credentials available for '${provider}'`);
            return null;
        }
        if (current.expires > Date.now() + 60000) {
            updatedCache[provider] = current;
            writeCache(updatedCache);
            return current.access;
        }
        const refreshed = await refreshAccessToken(current.refresh);
        if (refreshed.type === 'failed') {
            logger_1.logger.warn(`[pi-oauth] Failed to refresh OAuth key for '${provider}': ${refreshed.message}`);
            return null;
        }
        updatedCache[provider] = {
            type: 'oauth',
            access: refreshed.access,
            refresh: refreshed.refresh,
            expires: refreshed.expires,
        };
        writeCache(updatedCache);
        logger_1.logger.debug(`[pi-oauth] API key obtained for provider '${provider}'`);
        return refreshed.access;
    }
    catch (err) {
        logger_1.logger.warn(`[pi-oauth] Failed to get API key for '${provider}': ${(_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : String(err)}`);
        return null;
    }
};
exports.getPiOAuthApiKey = getPiOAuthApiKey;
//# sourceMappingURL=pi-oauth.service.js.map