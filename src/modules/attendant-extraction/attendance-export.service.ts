import httpStatus from 'http-status';
import { ApiError } from '../errors';
import { AttendanceExtractionExportFormat } from './attendant-extraction.interfaces';
import AttendantExtraction from './attendant-extraction.model';

type ExportResponse = {
  fileName: string;
  contentType: string;
  body: string;
};

const toCsvValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const buildJsonl = (extraction: any) => {
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

const buildCsv = (extraction: any) => {
  const students = extraction.humanCorrectedOutput?.students || [];
  const weekKeys = ['week_1', 'week_2', 'week_3', 'week_4', 'week_5'];
  const rows = [
    [
      'document_id',
      'row_number',
      'student_name',
      'admission_number',
      ...weekKeys,
      'uncertain_cells',
    ].join(','),
  ];

  students.forEach((student: any) => {
    rows.push(
      [
        extraction.id,
        student.row_number,
        student.student_name,
        student.admission_number,
        ...weekKeys.map((weekKey) => student.attendance?.[weekKey] || ''),
        (student.uncertain_cells || []).join('|'),
      ]
        .map(toCsvValue)
        .join(',')
    );
  });

  return `${rows.join('\n')}\n`;
};

const buildDocAi = (extraction: any) =>
  JSON.stringify(
    {
      documentId: extraction.id,
      imagePath: extraction.originalImagePath,
      preprocessedImagePath: extraction.preprocessedImagePath || '',
      ocrText: extraction.documentAiText || '',
      ocrLayoutSummary: extraction.documentAiLayoutSummary || {},
      draftLabel: extraction.llmExtractedOutput || null,
      groundTruth: extraction.humanCorrectedOutput,
    },
    null,
    2
  );

export const exportExtraction = async (id: string, format: AttendanceExtractionExportFormat): Promise<ExportResponse> => {
  const extraction = await AttendantExtraction.findById(id);
  if (!extraction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Extraction not found');
  }

  if (!extraction.humanCorrectedOutput) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Extraction must be corrected before export');
  }

  if (!['approved', 'exported'].includes(extraction.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only approved extractions can be exported');
  }

  let body: string;
  let fileName: string;
  let contentType: string;

  if (format === 'csv') {
    body = buildCsv(extraction);
    fileName = `${extraction.id}.csv`;
    contentType = 'text/csv; charset=utf-8';
  } else if (format === 'docai') {
    body = buildDocAi(extraction);
    fileName = `${extraction.id}.docai.json`;
    contentType = 'application/json; charset=utf-8';
  } else {
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
