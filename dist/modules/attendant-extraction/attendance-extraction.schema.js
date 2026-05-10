"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceExtractionSchema = exports.AttendanceWeekStringSchema = void 0;
const zod_1 = require("zod");
const ALLOWED_ATTENDANCE_VALUES = new Set(['P', 'A', 'X', 'O', '/', '-', 'V', 'v', '_', 'uncertain', '.', '..', '...']);
exports.AttendanceWeekStringSchema = zod_1.z.string().refine((value) => {
    const parts = value.trim().split(/\s+/);
    if (parts.length !== 5) {
        return false;
    }
    return parts.every((part) => ALLOWED_ATTENDANCE_VALUES.has(part));
}, {
    message: 'Each week must contain exactly five space-separated values for Monday to Friday.',
});
exports.AttendanceExtractionSchema = zod_1.z.object({
    document_metadata: zod_1.z.object({
        school_name: zod_1.z.string(),
        class: zod_1.z.string(),
        term: zod_1.z.string(),
        month: zod_1.z.string(),
        year: zod_1.z.string(),
        teacher_name: zod_1.z.string(),
        source_quality: zod_1.z.object({
            blurred: zod_1.z.boolean(),
            skewed: zod_1.z.boolean(),
            low_contrast: zod_1.z.boolean(),
            partially_cut_off: zod_1.z.boolean(),
        }),
    }),
    students: zod_1.z.array(zod_1.z.object({
        row_number: zod_1.z.number(),
        student_name: zod_1.z.string(),
        admission_number: zod_1.z.string(),
        attendance: zod_1.z.object({}).catchall(exports.AttendanceWeekStringSchema),
        uncertain_cells: zod_1.z.array(zod_1.z.string()),
    })),
    global_uncertainties: zod_1.z.array(zod_1.z.string()),
    extraction_notes: zod_1.z.array(zod_1.z.string()),
});
//# sourceMappingURL=attendance-extraction.schema.js.map