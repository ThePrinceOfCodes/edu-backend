"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRunFallbackOcr = exports.mergeParsedDocuments = exports.parseAttendantDocument = exports.normaliseStatusMark = void 0;
const HEADER_TOKENS = ['week ending', 'signature', 'total', 'm total', 'a total', 'no on roll', 'average attendance'];
/**
 * Maps a raw OCR mark token to the canonical attendance status enum value.
 * V / P / ✓            → present
 * x / . / .. / A / -  → absent
 * L                    → late
 * E                    → excused
 * Returns null for unrecognised tokens.
 */
const normaliseStatusMark = (mark) => {
    const m = mark.trim().toLowerCase();
    if (/^(v|p|o|\/|present|✓)$/.test(m))
        return 'present';
    if (/^(x|a|absent|\.{1,3}|-)$/.test(m))
        return 'absent';
    if (/^(l|late)$/.test(m))
        return 'late';
    if (/^(e|excused)$/.test(m))
        return 'excused';
    return null;
};
exports.normaliseStatusMark = normaliseStatusMark;
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
const isHeaderLike = (text) => {
    const lowered = normalize(text).toLowerCase();
    return HEADER_TOKENS.some((token) => lowered.includes(token));
};
const tokenize = (value) => normalize(value).split(/\s+/).filter(Boolean);
const isNumericLike = (value) => /^[\d./-]+$/.test(normalize(value));
const flattenRows = (document) => {
    const tables = ((document === null || document === void 0 ? void 0 : document.pages) || []).flatMap((page) => page.tables || []);
    return tables.flatMap((table) => {
        const rows = table.bodyRows || table.rows || [];
        return rows.map((row) => (row.cells || []).map((cell) => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                text: normalize(((_c = (_b = (_a = cell.layout) === null || _a === void 0 ? void 0 : _a.textAnchor) === null || _b === void 0 ? void 0 : _b.textSegments) === null || _c === void 0 ? void 0 : _c.length)
                    ? ((document === null || document === void 0 ? void 0 : document.text) || '').slice(Number(cell.layout.textAnchor.textSegments[0].startIndex || 0), Number(cell.layout.textAnchor.textSegments[0].endIndex || 0))
                    : ((_e = (_d = cell.layout) === null || _d === void 0 ? void 0 : _d.textAnchor) === null || _e === void 0 ? void 0 : _e.content) || ''),
                confidence: Number(((_f = cell.layout) === null || _f === void 0 ? void 0 : _f.confidence) || 0.5),
            });
        }));
    });
};
const scoreRow = (cells) => {
    const text = cells.map((cell) => cell.text).join(' ');
    const hasNameLike = /[a-zA-Z]{3,}/.test(text);
    const hasAdmission = /\b\d{2,}\b/.test(text) || /\b[A-Z]{2,}\/?[A-Z0-9/-]*\b/i.test(text);
    const numericNoise = cells.filter((cell) => isNumericLike(cell.text)).length;
    const confidence = cells.reduce((sum, cell) => sum + (cell.confidence || 0), 0) / Math.max(cells.length, 1);
    return { hasNameLike, hasAdmission, numericNoise, confidence };
};
const extractRow = (cells, rowNumber, source) => {
    var _a;
    const rawCells = cells.map((cell) => cell.text).filter(Boolean);
    const normalizedText = normalize(rawCells.join(' '));
    if (!normalizedText || isHeaderLike(normalizedText)) {
        return null;
    }
    const { hasNameLike, hasAdmission, numericNoise, confidence } = scoreRow(cells);
    const tokens = tokenize(normalizedText);
    const admissionNumber = ((_a = tokens.find((token) => /^(?:\d{2,}|[A-Z]{2,}[A-Z0-9/-]*)$/i.test(token))) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || null;
    const nameTokens = tokens.filter((token) => /[a-zA-Z]{2,}/.test(token) && !/^(present|absent|late|excused|v|x|p)$/i.test(token));
    const studentName = nameTokens.length ? nameTokens.slice(0, 3).join(' ') : null;
    // Capture standard letter marks AND dot-style absent marks (., .., ...)
    const statusMarks = tokens.filter((token) => /^(v|p|x|a|l|e|present|absent|late|excused|\.{1,3}|-)$/i.test(token));
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
const rowKey = (row) => `${row.rowNumber}:${row.admissionNumber || row.studentName || row.normalizedText.slice(0, 24)}`;
const betterText = (a, b) => {
    const left = a || '';
    const right = b || '';
    if (!left)
        return right || null;
    if (!right)
        return left;
    const leftScore = left.replace(/[^a-zA-Z]/g, '').length + left.trim().split(/\s+/).length;
    const rightScore = right.replace(/[^a-zA-Z]/g, '').length + right.trim().split(/\s+/).length;
    return rightScore > leftScore ? right : left;
};
const mergeRowCandidates = (primary, fallback) => {
    if (!fallback) {
        return primary;
    }
    const studentName = betterText(primary.studentName, fallback.studentName);
    const admissionNumber = primary.admissionNumber || fallback.admissionNumber || null;
    const statusMarks = primary.statusMarks.length >= fallback.statusMarks.length ? primary.statusMarks : fallback.statusMarks;
    const confidence = Math.max(primary.confidence, fallback.confidence);
    const merged = primary.matchReason !== 'unmatched' || fallback.matchReason !== 'unmatched';
    return Object.assign(Object.assign({}, primary), { studentName,
        admissionNumber,
        statusMarks,
        confidence, source: merged ? 'merged' : primary.source, matchReason: merged ? 'merged' : primary.matchReason, alternatives: {
            studentName: fallback.studentName,
            admissionNumber: fallback.admissionNumber,
            statusMarks: fallback.statusMarks,
        } });
};
const parseRows = (document, source) => {
    return flattenRows(document)
        .map((cells, index) => extractRow(cells, index + 1, source))
        .filter(Boolean);
};
const buildOutput = (document, rows) => {
    console.log('document', JSON.stringify(document, null, 2));
    const raw_json = (document === null || document === void 0 ? void 0 : document.text) || '';
    const rawText = raw_json
        .replace(/\\u2713/g, 'V')
        .replace(/✓/g, 'V')
        .replace(/\\u2611/g, 'V')
        .replace(/\u2713/g, 'V')
        .replace(/\u2611/g, 'V');
    const pages = (document === null || document === void 0 ? void 0 : document.pages) || [];
    const tables = pages.flatMap((page) => page.tables || []);
    const formFields = pages.flatMap((page) => page.formFields || []);
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
const parseAttendantDocument = (document) => buildOutput(document, parseRows(document, 'preprocessed'));
exports.parseAttendantDocument = parseAttendantDocument;
const mergeParsedDocuments = (primaryDocument, fallbackDocument) => {
    const primaryRows = parseRows(primaryDocument, 'preprocessed');
    if (!fallbackDocument) {
        return buildOutput(primaryDocument, primaryRows);
    }
    const fallbackRows = parseRows(fallbackDocument, 'original');
    const fallbackByKey = new Map(fallbackRows.map((row) => [rowKey(row), row]));
    const mergedRows = primaryRows.map((row) => mergeRowCandidates(row, fallbackByKey.get(rowKey(row))));
    return buildOutput(primaryDocument, mergedRows);
};
exports.mergeParsedDocuments = mergeParsedDocuments;
const shouldRunFallbackOcr = (parsed) => {
    if (!parsed.rows.length) {
        return true;
    }
    const weakRatio = parsed.unmatchedRows.length / Math.max(parsed.sheetMeta['totalRows'] || 1, 1);
    return weakRatio > 0.2;
};
exports.shouldRunFallbackOcr = shouldRunFallbackOcr;
//# sourceMappingURL=attendant-parser.service.js.map