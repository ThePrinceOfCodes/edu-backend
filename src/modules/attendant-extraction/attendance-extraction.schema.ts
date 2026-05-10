import { z } from 'zod';

const ALLOWED_ATTENDANCE_VALUES = new Set(['P', 'A', 'X', 'O', '/', '-', 'V', 'v', '_', 'uncertain', '.', '..', '...']);

export const AttendanceWeekStringSchema = z.string().refine(
  (value) => {
    const parts = value.trim().split(/\s+/);

    if (parts.length !== 5) {
      return false;
    }

    return parts.every((part) => ALLOWED_ATTENDANCE_VALUES.has(part));
  },
  {
    message: 'Each week must contain exactly five space-separated values for Monday to Friday.',
  }
);

export const AttendanceExtractionSchema = z.object({
  document_metadata: z.object({
    school_name: z.string(),
    class: z.string(),
    term: z.string(),
    month: z.string(),
    year: z.string(),
    teacher_name: z.string(),
    source_quality: z.object({
      blurred: z.boolean(),
      skewed: z.boolean(),
      low_contrast: z.boolean(),
      partially_cut_off: z.boolean(),
    }),
  }),
  students: z.array(
    z.object({
      row_number: z.number(),
      student_name: z.string(),
      admission_number: z.string(),
      attendance: z.object({
      }).catchall(AttendanceWeekStringSchema),
      uncertain_cells: z.array(z.string()),
    })
  ),
  global_uncertainties: z.array(z.string()),
  extraction_notes: z.array(z.string()),
});

export type AttendanceExtractionPayload = z.infer<typeof AttendanceExtractionSchema>;
