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

const extractJsonFromMarkdown = (input: string): string => {
  const trimmed = input.trim();
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }
  const inlineCodeMatch = trimmed.match(/^`([^`]+)`$/);
  if (inlineCodeMatch?.[1]) {
    return inlineCodeMatch[1].trim();
  }
  return input;
};

export const parseJsonCandidate = (rawResponse: string): unknown => {
  const cleaned = extractJsonFromMarkdown(rawResponse);
  return JSON.parse(cleaned);
};

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
