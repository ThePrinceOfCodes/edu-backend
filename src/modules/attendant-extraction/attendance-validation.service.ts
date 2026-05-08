import { ZodError } from 'zod';
import { AttendanceExtractionPayload, AttendanceExtractionSchema } from './attendance-extraction.schema';

type ValidationSuccess = {
  isValid: true;
  data: AttendanceExtractionPayload;
  errors: [];
};

type ValidationFailure = {
  isValid: false;
  data: null;
  errors: string[];
};

type ValidationResult = ValidationSuccess | ValidationFailure;

const normalizeUnknown = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
};

export const parseJsonCandidate = (rawResponse: string): unknown => JSON.parse(rawResponse);

export const formatValidationErrors = (error: ZodError): string[] =>
  error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
  });

export const validateAttendanceExtraction = (value: unknown): ValidationResult => {
  const parsed = AttendanceExtractionSchema.safeParse(value);

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
    errors: formatValidationErrors(parsed.error),
  };
};

export const validateRawAttendanceExtraction = (rawResponse: string): ValidationResult => {
  try {
    const candidate = parseJsonCandidate(rawResponse);
    return validateAttendanceExtraction(candidate);
  } catch (error) {
    return {
      isValid: false,
      data: null,
      errors: [`json: ${normalizeUnknown(error instanceof Error ? error.message : error)}`],
    };
  }
};
