"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExtraction = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const attendant_extraction_model_1 = __importDefault(require("./attendant-extraction.model"));
const toCsvValue = (value) => `"${String(value).replace(/"/g, '""')}"`;
const buildJsonl = (extraction) => {
    const payload = {
        document_id: extraction.id,
        image_path: extraction.originalImagePath,
        preprocessed_image_path: extraction.preprocessedImagePath || '',
        ground_truth: extraction.humanCorrectedOutput,
        draft_label: extraction.llmExtractedOutput || null,
        document_ai_text: extraction.documentAiText || '',
        document_ai_raw_output: extraction.documentAiRawOutput || {},
    };
    return `${JSON.stringify(payload)}\n`;
};
const buildCsv = (extraction) => {
    var _a;
    const students = ((_a = extraction.humanCorrectedOutput) === null || _a === void 0 ? void 0 : _a.students) || [];
    const rows = [
        [
            'document_id',
            'row_number',
            'student_name',
            'admission_number',
            'week_1',
            'week_2',
            'week_3',
            'week_4',
            'week_5',
            'uncertain_cells',
        ].join(','),
    ];
    students.forEach((student) => {
        rows.push([
            extraction.id,
            student.row_number,
            student.student_name,
            student.admission_number,
            student.attendance.week_1,
            student.attendance.week_2,
            student.attendance.week_3,
            student.attendance.week_4,
            student.attendance.week_5,
            (student.uncertain_cells || []).join('|'),
        ]
            .map(toCsvValue)
            .join(','));
    });
    return `${rows.join('\n')}\n`;
};
const buildDocAi = (extraction) => JSON.stringify({
    documentId: extraction.id,
    imagePath: extraction.originalImagePath,
    preprocessedImagePath: extraction.preprocessedImagePath || '',
    ocrText: extraction.documentAiText || '',
    ocrLayoutSummary: extraction.documentAiLayoutSummary || {},
    draftLabel: extraction.llmExtractedOutput || null,
    groundTruth: extraction.humanCorrectedOutput,
}, null, 2);
const exportExtraction = async (id, format) => {
    const extraction = await attendant_extraction_model_1.default.findById(id);
    if (!extraction) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Extraction not found');
    }
    if (!extraction.humanCorrectedOutput) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Extraction must be corrected before export');
    }
    if (!['approved', 'exported'].includes(extraction.status)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Only approved extractions can be exported');
    }
    let body;
    let fileName;
    let contentType;
    if (format === 'csv') {
        body = buildCsv(extraction);
        fileName = `${extraction.id}.csv`;
        contentType = 'text/csv; charset=utf-8';
    }
    else if (format === 'docai') {
        body = buildDocAi(extraction);
        fileName = `${extraction.id}.docai.json`;
        contentType = 'application/json; charset=utf-8';
    }
    else {
        body = buildJsonl(extraction);
        fileName = `${extraction.id}.jsonl`;
        contentType = 'application/x-ndjson; charset=utf-8';
    }
    extraction.exportedAt = new Date();
    if (extraction.status === 'approved') {
        extraction.status = 'exported';
    }
    await extraction.save();
    return { body, fileName, contentType };
};
exports.exportExtraction = exportExtraction;
//# sourceMappingURL=attendance-export.service.js.map