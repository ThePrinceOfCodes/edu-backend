"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const document_ai_service_1 = require("../modules/attendant-extraction/document-ai.service");
const filePath = process.argv[2];
const run = async () => {
    if (!filePath) {
        throw new Error('Usage: tsx src/scripts/testDocumentAi.ts <file-path>');
    }
    const document = await (0, document_ai_service_1.processDocument)(filePath);
    console.log(JSON.stringify(document, null, 2));
};
run().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=testDocumentAi.js.map