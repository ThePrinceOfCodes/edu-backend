"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const ai_services_1 = require("./ai.services");
class OpenAIClient {
    constructor() {
        this.client = new openai_1.default({
            apiKey: process.env["OPENAI_API_KEY"],
        });
    }
    async generate(prompt) {
        return (0, ai_services_1.withRetry)(async () => {
            var _a;
            const messages = typeof prompt === 'string'
                ? [{ role: 'user', content: prompt }]
                : prompt;
            const res = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages,
            });
            const usage = res.usage;
            const estimatedCostUSD = (usage.prompt_tokens * 0.00015 +
                usage.completion_tokens * 0.0006) / 1000;
            return {
                data: ((_a = res.choices[0]) === null || _a === void 0 ? void 0 : _a.message.content) || '',
                usage: {
                    provider: 'openai',
                    model: res.model,
                    inputTokens: usage.prompt_tokens,
                    outputTokens: usage.completion_tokens,
                    totalTokens: usage.total_tokens,
                    estimatedCostUSD,
                },
                raw: res,
            };
        });
    }
}
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=openai.services.js.map