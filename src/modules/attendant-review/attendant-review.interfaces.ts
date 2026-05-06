import { Document, Model } from 'mongoose';

export type AttendantReviewResolutionStatus = 'pending' | 'resolved' | 'ignored';

export interface IAttendantReview {
  schoolId: string;
  extractionId: string;
  sourceImagePath: string;
  rawRow: Record<string, any>;
  parsedAttempt?: Record<string, any>;
  reason: string;
  confidence?: number;
  resolvedStudentId?: string;
  resolvedStatus: AttendantReviewResolutionStatus;
}

export interface IAttendantReviewDoc extends IAttendantReview, Document {}

export interface IAttendantReviewModel extends Model<IAttendantReviewDoc> {
  paginate(filter: any, options: any): Promise<any>;
}
