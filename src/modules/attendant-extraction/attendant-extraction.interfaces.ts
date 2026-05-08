import { HydratedDocument, Model } from 'mongoose';

export type AttendantExtractionStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'ocr_completed'
  | 'llm_extracted'
  | 'validation_failed'
  | 'pending_review'
  | 'corrected'
  | 'approved'
  | 'exported'
  | 'failed';

export type AttendanceExtractionExportFormat = 'jsonl' | 'csv' | 'docai';

export interface IAttendanceApprovalMeta {
  approvedBy: string;
  approvedAt: Date;
}

export interface IAttendantExtraction {
  createdBy?: string | null;
  schoolId: string;
  termId: string;
  academicSessionId: string;
  startDate: Date;
  endDate: Date;
  imagePath?: string;
  originalImagePath: string;
  mimeType: string;
  preprocessedImagePath?: string;
  rawOcrJson?: Record<string, any>;
  rawText?: string;
  parsedJson?: Record<string, any>;
  documentAiRawOutput?: Record<string, any>;
  documentAiText?: string;
  documentAiLayoutSummary?: Record<string, any>;
  llmRawResponse?: string;
  llmExtractedOutput?: Record<string, any>;
  humanCorrectedOutput?: Record<string, any> | null;
  validationErrors?: string[];
  provider?: string;
  model?: string;
  approvalMeta?: IAttendanceApprovalMeta;
  exportedAt?: Date;
  status: AttendantExtractionStatus;
  error?: string;
  processingMeta?: Record<string, any>;
  createdAttendanceIds?: string[];
  pendingReviewIds?: string[];
}

export type IAttendantExtractionApiResponse = IAttendantExtraction & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string | null;
};

export type IAttendantExtractionDoc = HydratedDocument<IAttendantExtraction>;

export interface IAttendantExtractionModel extends Model<IAttendantExtractionDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
