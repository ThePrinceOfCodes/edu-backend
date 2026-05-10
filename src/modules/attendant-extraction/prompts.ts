export const ATTENDANCE_EXTRACTION_PROMPT_VERSION = 'attendance-v2';

export const ATTENDANCE_EXTRACTION_PROMPT = `You are extracting data from a school attendance register image.

You must extract exactly what is visible in the image.

Rules:
- Return only valid JSON.
- Do not include markdown.
- Do not guess missing or unclear values.
- Empty attendance cells must be represented with "_".
- If a cell is unclear, return "uncertain".
- If a cell shows a dot, treat it as absent and return ".".
- If a cell has any other visible mark, treat it as present and return "P".
- If a cell is empty, leave it as "_".
- Do not autocorrect names.
- Do not invent admission numbers.
- Do not infer values from neighboring rows.
- Preserve row numbers exactly.
- Preserve student names exactly as visible.
- Preserve admission numbers exactly as visible.
- Pay careful attention to the right-hand side of the table.
- Pay careful attention to week/day columns.
- If the image and OCR disagree, prefer the image.
- If the image is unclear, mark the affected cell as "uncertain".
- Do not skip attendance positions.

Attendance format:
Only include the attendance week keys that are visible in the image.

Each attendance week must be represented as a single compact string, not as a day-by-day object.

Each week string must contain exactly five space-separated values in this order:

Monday Tuesday Wednesday Thursday Friday

Example:

"week_1": "P P P A P"

This means:
Monday = P
Tuesday = P
Wednesday = P
Thursday = A
Friday = P

If a day cell is blank, use "_".

Example:

"week_2": "P _ P X -"

If the whole week has visible "v" marks, represent it like this:

"week_5": "v v v v v"

Do not output this invalid format:

["week_5": "v v v v v"]

Correct format:

"week_5": "v v v v v"

Return JSON using this exact structure:

{
  "document_metadata": {
    "school_name": "",
    "class": "",
    "term": "",
    "month": "",
    "year": "",
    "teacher_name": "",
    "source_quality": {
      "blurred": false,
      "skewed": false,
      "low_contrast": false,
      "partially_cut_off": false
    }
  },
  "students": [
    {
      "row_number": 1,
      "student_name": "",
      "admission_number": "",
      "attendance": {
        "week_3": "P P P . P"
      },
      "uncertain_cells": []
    }
  ],
  "global_uncertainties": [],
  "extraction_notes": []
}`;

export const ATTENDANCE_EXTRACTION_REPAIR_PROMPT = `The previous response was not valid JSON.
Return the same extraction again as valid JSON only.
Do not include markdown or explanation.
Do not change the extraction content unless required to make the JSON valid.`;
