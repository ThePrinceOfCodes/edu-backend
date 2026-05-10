"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveExtraction = exports.correctExtraction = void 0;
const http_status_1 = __importDefault(require("http-status"));
const errors_1 = require("../errors");
const attendant_extraction_model_1 = __importDefault(require("./attendant-extraction.model"));
const attendance_validation_service_1 = require("./attendance-validation.service");
const attendant_attendance_service_1 = require("./attendant-attendance.service");
const persistCorrectedAttendance = async (extraction, payload) => {
    const createdAttendance = await (0, attendant_attendance_service_1.createAttendanceFromExtractionPayload)({
        schoolId: extraction.schoolId,
        termId: extraction.termId,
        academicSessionId: extraction.academicSessionId,
        startDate: new Date(extraction.startDate),
        endDate: new Date(extraction.endDate),
        students: payload.students,
    });
    extraction.createdAttendanceIds = createdAttendance.map((item) => String(item.id || item._id)).filter(Boolean);
};
const CORRECTABLE_STATUSES = new Set(['ocr_completed', 'pending_review', 'corrected']);
const correctExtraction = async (id, payload) => {
    const extraction = await attendant_extraction_model_1.default.findById(id);
    if (!extraction) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Extraction not found');
    }
    if (!CORRECTABLE_STATUSES.has(extraction.status)) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, `Extraction cannot be corrected from status '${extraction.status}'`);
    }
    const validation = (0, attendance_validation_service_1.validateAttendanceExtraction)(payload);
    if (!validation.isValid) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, validation.errors.join(', '));
    }
    extraction.humanCorrectedOutput = validation.data;
    await persistCorrectedAttendance(extraction, validation.data);
    extraction.status = 'corrected';
    extraction.validationErrors = [];
    await extraction.save();
    return extraction;
};
exports.correctExtraction = correctExtraction;
const approveExtraction = async (id, approvedBy) => {
    const extraction = await attendant_extraction_model_1.default.findById(id);
    if (!extraction) {
        throw new errors_1.ApiError(http_status_1.default.NOT_FOUND, 'Extraction not found');
    }
    if (!extraction.humanCorrectedOutput) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, 'Extraction must be corrected before approval');
    }
    const validation = (0, attendance_validation_service_1.validateAttendanceExtraction)(extraction.humanCorrectedOutput);
    if (!validation.isValid) {
        throw new errors_1.ApiError(http_status_1.default.BAD_REQUEST, validation.errors.join(', '));
    }
    extraction.humanCorrectedOutput = validation.data;
    await persistCorrectedAttendance(extraction, validation.data);
    extraction.approvalMeta = {
        approvedBy,
        approvedAt: new Date(),
    };
    extraction.status = 'approved';
    await extraction.save();
    return extraction;
};
exports.approveExtraction = approveExtraction;
//# sourceMappingURL=attendance-correction.service.js.map