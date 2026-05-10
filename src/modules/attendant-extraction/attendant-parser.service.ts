type ParsedCell = {
  text: string;
  confidence: number;
};

type ParsedRow = {
  rowNumber: number;
  studentName: string | null;
  admissionNumber: string | null;
  statusMarks: string[];
  confidence: number;
  rawCells: string[];
  normalizedText: string;
  matchReason: string;
  source: 'preprocessed' | 'original' | 'merged';
  alternatives?: {
    studentName?: string | null;
    admissionNumber?: string | null;
    statusMarks?: string[];
  };
};

export type ParsedAttendantDocument = {
  rawText: string;
  pages: any[];
  tables: any[];
  formFields: any[];
  rows: ParsedRow[];
  unmatchedRows: ParsedRow[];
  sheetMeta: Record<string, any>;
};

const HEADER_TOKENS = ['week ending', 'signature', 'total', 'm total', 'a total', 'no on roll', 'average attendance'];

/**
 * Maps a raw OCR mark token to the canonical attendance status enum value.
 * V / P / ✓            → present
 * x / . / .. / A / -  → absent
 * L                    → late
 * E                    → excused
 * Returns null for unrecognised tokens.
 */
export const normaliseStatusMark = (mark: string): 'present' | 'absent' | 'late' | 'excused' | null => {
  const m = mark.trim().toLowerCase();
  if (/^(v|p|o|\/|present|✓)$/.test(m)) return 'present';
  if (/^(x|a|absent|\.{1,3}|-)$/.test(m)) return 'absent';
  if (/^(l|late)$/.test(m)) return 'late';
  if (/^(e|excused)$/.test(m)) return 'excused';
  return null;
};

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const isHeaderLike = (text: string) => {
  const lowered = normalize(text).toLowerCase();
  return HEADER_TOKENS.some((token) => lowered.includes(token));
};

const tokenize = (value: string) => normalize(value).split(/\s+/).filter(Boolean);

const isNumericLike = (value: string) => /^[\d./-]+$/.test(normalize(value));

const flattenRows = (document: any): ParsedCell[][] => {
  const tables = (document?.pages || []).flatMap((page: any) => page.tables || []);

  return tables.flatMap((table: any) => {
    const rows = table.bodyRows || table.rows || [];

    return rows.map((row: any) =>
      (row.cells || []).map((cell: any) => ({
        text: normalize(
          cell.layout?.textAnchor?.textSegments?.length
            ? (document?.text || '').slice(
                Number(cell.layout.textAnchor.textSegments[0].startIndex || 0),
                Number(cell.layout.textAnchor.textSegments[0].endIndex || 0)
              )
            : cell.layout?.textAnchor?.content || ''
        ),
        confidence: Number(cell.layout?.confidence || 0.5),
      }))
    );
  });
};

const scoreRow = (cells: ParsedCell[]) => {
  const text = cells.map((cell) => cell.text).join(' ');
  const hasNameLike = /[a-zA-Z]{3,}/.test(text);
  const hasAdmission = /\b\d{2,}\b/.test(text) || /\b[A-Z]{2,}\/?[A-Z0-9/-]*\b/i.test(text);
  const numericNoise = cells.filter((cell) => isNumericLike(cell.text)).length;
  const confidence = cells.reduce((sum, cell) => sum + (cell.confidence || 0), 0) / Math.max(cells.length, 1);

  return { hasNameLike, hasAdmission, numericNoise, confidence };
};

const extractRow = (cells: ParsedCell[], rowNumber: number, source: ParsedRow['source']): ParsedRow | null => {
  const rawCells = cells.map((cell) => cell.text).filter(Boolean);
  const normalizedText = normalize(rawCells.join(' '));

  if (!normalizedText || isHeaderLike(normalizedText)) {
    return null;
  }

  const { hasNameLike, hasAdmission, numericNoise, confidence } = scoreRow(cells);
  const tokens = tokenize(normalizedText);
  const admissionNumber = tokens.find((token) => /^(?:\d{2,}|[A-Z]{2,}[A-Z0-9/-]*)$/i.test(token))?.toUpperCase() || null;
  const nameTokens = tokens.filter((token) => /[a-zA-Z]{2,}/.test(token) && !/^(present|absent|late|excused|v|x|p)$/i.test(token));
  const studentName = nameTokens.length ? nameTokens.slice(0, 3).join(' ') : null;
  // Capture standard letter marks AND dot-style absent marks (., .., ...)
  const statusMarks = tokens.filter((token) =>
    /^(v|p|x|a|l|e|present|absent|late|excused|\.{1,3}|-)$/i.test(token)
  );

  const weakMatch = !hasNameLike || (!hasAdmission && numericNoise > 2) || confidence < 0.25;

  return {
    rowNumber,
    studentName,
    admissionNumber,
    statusMarks,
    confidence,
    rawCells,
    normalizedText,
    matchReason: weakMatch ? 'unmatched' : admissionNumber ? 'matched-by-admission-number' : 'matched-by-name',
    source,
  };
};

const rowKey = (row: ParsedRow) => `${row.rowNumber}:${row.admissionNumber || row.studentName || row.normalizedText.slice(0, 24)}`;

const betterText = (a?: string | null, b?: string | null) => {
  const left = a || '';
  const right = b || '';

  if (!left) return right || null;
  if (!right) return left;

  const leftScore = left.replace(/[^a-zA-Z]/g, '').length + left.trim().split(/\s+/).length;
  const rightScore = right.replace(/[^a-zA-Z]/g, '').length + right.trim().split(/\s+/).length;

  return rightScore > leftScore ? right : left;
};

const mergeRowCandidates = (primary: ParsedRow, fallback?: ParsedRow): ParsedRow => {
  if (!fallback) {
    return primary;
  }

  const studentName = betterText(primary.studentName, fallback.studentName);
  const admissionNumber = primary.admissionNumber || fallback.admissionNumber || null;
  const statusMarks = primary.statusMarks.length >= fallback.statusMarks.length ? primary.statusMarks : fallback.statusMarks;
  const confidence = Math.max(primary.confidence, fallback.confidence);
  const merged = primary.matchReason !== 'unmatched' || fallback.matchReason !== 'unmatched';

  return {
    ...primary,
    studentName,
    admissionNumber,
    statusMarks,
    confidence,
    source: merged ? 'merged' : primary.source,
    matchReason: merged ? 'merged' : primary.matchReason,
    alternatives: {
      studentName: fallback.studentName,
      admissionNumber: fallback.admissionNumber,
      statusMarks: fallback.statusMarks,
    },
  };
};

const parseRows = (document: any, source: ParsedRow['source']) => {
  return flattenRows(document)
    .map((cells, index) => extractRow(cells, index + 1, source))
    .filter(Boolean) as ParsedRow[];
};

const buildOutput = (document: any, rows: ParsedRow[]): ParsedAttendantDocument => {
  console.log('document', JSON.stringify(document, null, 2));
  const raw_json = document?.text || '';
  const rawText = raw_json
    .replace(/\\u2713/g, 'V')
    .replace(/✓/g, 'V')
    .replace(/\\u2611/g, 'V')
    .replace(/\u2713/g, 'V')
    .replace(/\u2611/g, 'V');
  const pages = document?.pages || [];
  const tables = pages.flatMap((page: any) => page.tables || []);
  const formFields = pages.flatMap((page: any) => page.formFields || []);

  const confidentRows = rows.filter((row) => row.matchReason !== 'unmatched');
  const unmatchedRows = rows.filter((row) => row.matchReason === 'unmatched');

  return {
    rawText,
    pages,
    tables,
    formFields,
    rows: confidentRows,
    unmatchedRows,
    sheetMeta: {
      totalRows: rows.length,
      confidentRows: confidentRows.length,
      unmatchedRows: unmatchedRows.length,
    },
  };
};

export const parseAttendantDocument = (document: any) => buildOutput(document, parseRows(document, 'preprocessed'));

export const mergeParsedDocuments = (primaryDocument: any, fallbackDocument?: any) => {
  const primaryRows = parseRows(primaryDocument, 'preprocessed');

  if (!fallbackDocument) {
    return buildOutput(primaryDocument, primaryRows);
  }

  const fallbackRows = parseRows(fallbackDocument, 'original');
  const fallbackByKey = new Map(fallbackRows.map((row) => [rowKey(row), row]));

  const mergedRows = primaryRows.map((row) => mergeRowCandidates(row, fallbackByKey.get(rowKey(row))));

  return buildOutput(primaryDocument, mergedRows);
};

export const shouldRunFallbackOcr = (parsed: ParsedAttendantDocument) => {
  if (!parsed.rows.length) {
    return true;
  }

  const weakRatio = parsed.unmatchedRows.length / Math.max((parsed.sheetMeta['totalRows'] as number) || 1, 1);
  return weakRatio > 0.2;
};
