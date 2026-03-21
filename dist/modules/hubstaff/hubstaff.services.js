"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hubstaffService = void 0;
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("../redis");
const config_1 = __importDefault(require("@src/config/config"));
const crypto_1 = __importDefault(require("crypto"));
const hubstaff_access_token_model_1 = __importDefault(require("./hubstaff_access_token.model"));
class HubstaffManagementService {
    constructor() {
        this.API_BASE_URL = config_1.default.hubstaff.api_base_url;
        this.baseUrl = config_1.default.hubstaff.auth_base_url;
        this.discoveryClient = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                "Content-Type": "application/json",
            },
        });
        this.hubstaffClient = axios_1.default.create({
            baseURL: this.API_BASE_URL,
            headers: {
                "Content-Type": "application/json",
            },
        });
        this.setupRequirements();
    }
    async setupRequirements() {
        var _a;
        try {
            const redisData = await redis_1.redisClient.get("hubstaff_requirements");
            if (redisData) {
                return;
            }
            const response = await this.discoveryClient.get("");
            const { authorization_endpoint, token_endpoint, userinfo_endpoint } = response.data;
            await redis_1.redisClient.setex("hubstaff_requirements", 60 * 60 * 24 * 7, JSON.stringify({ authorization_endpoint, token_endpoint, userinfo_endpoint }));
        }
        catch (error) {
            console.warn(`[Hubstaff] setupRequirements failed (will retry on next use): ${(_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : error}`);
        }
    }
    async getAuthorizationUrl(organizationId) {
        let redisData = await redis_1.redisClient.get("hubstaff_requirements");
        if (!redisData) {
            await this.setupRequirements();
            redisData = await redis_1.redisClient.get("hubstaff_requirements");
        }
        if (!redisData) {
            throw new Error('[Hubstaff] Discovery endpoint unavailable. Check HUBSTAFF_AUTH_BASE_URL configuration.');
        }
        const { authorization_endpoint } = JSON.parse(redisData);
        const nonce = crypto_1.default.randomBytes(16).toString('hex');
        return `${authorization_endpoint}?client_id=${config_1.default.hubstaff.client}&redirect_uri=${config_1.default.hubstaff.redirect_uri}&response_type=code&scope=hubstaff:read&nonce=${nonce}&state=${organizationId}`;
    }
    async getToken(code, organizationId) {
        let redisData = await redis_1.redisClient.get("hubstaff_requirements");
        if (!redisData) {
            await this.setupRequirements();
            redisData = await redis_1.redisClient.get("hubstaff_requirements");
        }
        if (!redisData) {
            throw new Error('[Hubstaff] Discovery endpoint unavailable. Check HUBSTAFF_AUTH_BASE_URL configuration.');
        }
        const { token_endpoint } = JSON.parse(redisData);
        const response = await axios_1.default.post(token_endpoint, {
            redirect_uri: config_1.default.hubstaff.redirect_uri,
            code,
            grant_type: "authorization_code",
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${Buffer.from(`${config_1.default.hubstaff.client}:${config_1.default.hubstaff.secret}`).toString('base64')}`,
            },
        });
        const orgResponse = await this.hubstaffClient.get("/v2/organizations", {
            headers: {
                "Authorization": `Bearer ${response.data.access_token}`,
            },
        });
        // Store token in DB
        await hubstaff_access_token_model_1.default.updateOne({ organizationId }, {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            token_type: response.data.token_type,
            expires_in: new Date().getTime() + ((response.data.expires_in - 120) * 1000),
            organizationId,
            hubstaff_organization_id: orgResponse.data.organizations.map((org) => org.id)
        }, { upsert: true });
        return response.data;
    }
    async getHubstaffProjects(organizationId) {
        const accessData = await hubstaff_access_token_model_1.default.findOne({ organizationId });
        if (!accessData) {
            throw new Error("Token not found");
        }
        const { access_token, expires_in, hubstaff_organization_id } = accessData;
        const now = new Date().getTime();
        // Re-assign access_token if we refresh
        let validAccessToken = access_token;
        if (now > expires_in) {
            const refreshedData = await this.refreshToken(organizationId);
            validAccessToken = refreshedData.access_token;
        }
        const projects = [];
        for (let orgId of hubstaff_organization_id) {
            const response = await this.hubstaffClient.get(`/v2/organizations/${orgId}/projects`, {
                headers: {
                    "Authorization": `Bearer ${validAccessToken}`,
                },
            });
            projects.push(...response.data.projects);
        }
        return projects;
    }
    async refreshToken(organizationId) {
        try {
            const accessData = await hubstaff_access_token_model_1.default.findOne({ organizationId });
            if (!accessData) {
                throw new Error("Token not found");
            }
            const { refresh_token } = accessData;
            let redisData = await redis_1.redisClient.get("hubstaff_requirements");
            if (!redisData) {
                await this.setupRequirements();
                redisData = await redis_1.redisClient.get("hubstaff_requirements");
            }
            if (!redisData) {
                throw new Error('[Hubstaff] Discovery endpoint unavailable. Check HUBSTAFF_AUTH_BASE_URL configuration.');
            }
            const { token_endpoint } = JSON.parse(redisData);
            const response = await axios_1.default.post(token_endpoint, {
                refresh_token,
                grant_type: "refresh_token",
            }, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${Buffer.from(`${config_1.default.hubstaff.client}:${config_1.default.hubstaff.secret}`).toString('base64')}`,
                },
            });
            // Store token in DB
            await hubstaff_access_token_model_1.default.updateOne({ organizationId }, {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                token_type: response.data.token_type,
                expires_in: new Date().getTime() + ((response.data.expires_in - 120) * 1000),
                organizationId
            }, { upsert: true });
            return response.data;
        }
        catch (error) {
            console.log(error);
        }
    }
    async disconnect(organizationId) {
        const accessData = await hubstaff_access_token_model_1.default.findOne({ organizationId });
        if (!accessData) {
            throw new Error("Organization is not connected to Hubstaff");
        }
        //eventually connection will expire on hubstaff
        await hubstaff_access_token_model_1.default.deleteOne({ organizationId });
    }
}
exports.hubstaffService = new HubstaffManagementService();
//# sourceMappingURL=hubstaff.services.js.map