"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const ai_services_1 = require("./ai.services");
class AnthropicClient {
    constructor() {
        this.client = new sdk_1.default({
            apiKey: process.env["CLAUDE_API_KEY"],
        });
    }
    async generate(prompt) {
        return (0, ai_services_1.withRetry)(async () => {
            let messages = [];
            let system;
            if (typeof prompt === 'string') {
                messages = [{ role: 'user', content: prompt }];
            }
            else {
                // Extract system message if present
                const systemMsg = prompt.find((m) => m.role === 'system');
                if (systemMsg) {
                    system = systemMsg.content;
                }
                messages = prompt.filter((m) => m.role !== 'system');
            }
            const params = {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: messages,
            };
            if (system) {
                params.system = system;
            }
            const res = await this.client.messages.create(params);
            const inputTokens = res.usage.input_tokens;
            const outputTokens = res.usage.output_tokens;
            const estimatedCostUSD = (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
            return {
                // @ts-ignore
                data: res.content[0].text,
                usage: {
                    provider: 'anthropic',
                    model: res.model,
                    inputTokens,
                    outputTokens,
                    totalTokens: inputTokens + outputTokens,
                    estimatedCostUSD,
                },
                raw: res,
            };
        });
    }
}
exports.AnthropicClient = AnthropicClient;
//# sourceMappingURL=anthropic.services.js.map