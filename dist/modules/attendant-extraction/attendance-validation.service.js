"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRawAttendanceExtraction = exports.validateAttendanceExtraction = exports.formatValidationErrors = exports.parseJsonCandidate = void 0;
const attendance_extraction_schema_1 = require("./attendance-extraction.schema");
const normalizeUnknown = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    return JSON.stringify(value);
};
const extractJsonFromMarkdown = (input) => {
    const trimmed = input.trim();
    const codeBlockMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
    if (codeBlockMatch === null || codeBlockMatch === void 0 ? void 0 : codeBlockMatch[1]) {
        return codeBlockMatch[1].trim();
    }
    const inlineCodeMatch = trimmed.match(/^`([^`]+)`$/);
    if (inlineCodeMatch === null || inlineCodeMatch === void 0 ? void 0 : inlineCodeMatch[1]) {
        return inlineCodeMatch[1].trim();
    }
    return input;
};
const parseJsonCandidate = (rawResponse) => {
    const cleaned = extractJsonFromMarkdown(rawResponse);
    return JSON.parse(cleaned);
};
exports.parseJsonCandidate = parseJsonCandidate;
const formatValidationErrors = (error) => error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
});
exports.formatValidationErrors = formatValidationErrors;
const validateAttendanceExtraction = (value) => {
    const parsed = attendance_extraction_schema_1.AttendanceExtractionSchema.safeParse(value);
    if (parsed.success) {
        return {
            isValid: true,
            data: parsed.data,
            errors: [],
        };
    }
    return {
        isValid: false,
        data: null,
        errors: (0, exports.formatValidationErrors)(parsed.error),
    };
};
exports.validateAttendanceExtraction = validateAttendanceExtraction;
const validateRawAttendanceExtraction = (rawResponse) => {
    try {
        const candidate = (0, exports.parseJsonCandidate)(rawResponse);
        return (0, exports.validateAttendanceExtraction)(candidate);
    }
    catch (error) {
        return {
            isValid: false,
            data: null,
            errors: [`json: ${normalizeUnknown(error instanceof Error ? error.message : error)}`],
        };
    }
};
exports.validateRawAttendanceExtraction = validateRawAttendanceExtraction;
//# sourceMappingURL=attendance-validation.service.js.map