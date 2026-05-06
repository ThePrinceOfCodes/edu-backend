import { Document, Model } from 'mongoose';

export type AttendantExtractionStatus = 'uploaded' | 'queued' | 'processing' | 'parsed' | 'attendance_created' | 'needs_review' | 'failed';

export interface IAttendantExtraction {
  schoolId: string;
  termId: string;
  academicSessionId: string;
  startDate: Date;
  endDate: Date;
  imagePath: string;
  preprocessedImagePath?: string;
  rawOcrJson?: Record<string, any>;
  rawText?: string;
  parsedJson?: Record<string, any>;
  status: AttendantExtractionStatus;
  error?: string;
  processingMeta?: Record<string, any>;
  createdAttendanceIds?: string[];
  pendingReviewIds?: string[];
}

export interface IAttendantExtractionDoc extends IAttendantExtraction, Document {}

export interface IAttendantExtractionModel extends Model<IAttendantExtractionDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
