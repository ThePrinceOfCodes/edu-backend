"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSampleData = exports.handleExport = void 0;
const XLSX = __importStar(require("xlsx-js-style"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const createWorkbook = ({ statsData, tableData, reviewData, assessmentData, additionalQuestionsData }) => {
    var _a;
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    if (statsData) {
        const ws = XLSX.utils.aoa_to_sheet(statsData);
        const colWidths = [
            { wch: 35 },
            { wch: 40 },
            { wch: 120 }, // Width of column B (Age)
        ];
        // Apply column widths to the worksheet
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, ws, "Course Statistics");
    }
    if (tableData) {
        // Create a worksheet for Sheet 2
        const sheet2 = XLSX.utils.aoa_to_sheet(tableData);
        const colWidths2 = [
            { wch: 50 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 30 }, // Width of column B (Age)
        ];
        // Apply column widths to the worksheet
        sheet2['!cols'] = colWidths2;
        // Add Sheet 2 to the workbook
        XLSX.utils.book_append_sheet(workbook, sheet2, 'Course Students');
    }
    if (reviewData) {
        // Create a worksheet for Sheet 2
        const sheet3 = XLSX.utils.aoa_to_sheet(reviewData);
        const colWidths3 = [
            { wch: 70 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 }, // Width of column B (Phone number)
        ];
        // Apply column widths to the worksheet
        sheet3['!cols'] = colWidths3;
        // Add Sheet 2 to the workbook
        XLSX.utils.book_append_sheet(workbook, sheet3, 'Survey responses');
    }
    if (assessmentData) {
        const sheet3 = XLSX.utils.aoa_to_sheet(assessmentData);
        const colWidths3 = [
            { wch: 70 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 }, // Width of column B (Phone number)
        ];
        // Apply column widths to the worksheet
        sheet3['!cols'] = colWidths3;
        // Add Sheet 2 to the workbook
        XLSX.utils.book_append_sheet(workbook, sheet3, "Assessments");
    }
    if (additionalQuestionsData && additionalQuestionsData[0]) {
        const sheet4 = XLSX.utils.aoa_to_sheet(additionalQuestionsData);
        const colWidths4 = (_a = additionalQuestionsData[0]) === null || _a === void 0 ? void 0 : _a.map((_, index) => {
            if (index === 0) {
                return { wch: 40 };
            }
            else if (index < 2) {
                return { wch: 30 };
            }
            return { wch: 50 };
        });
        // Apply column widths to the worksheet
        sheet4['!cols'] = colWidths4;
        // Add Sheet 2 to the workbook
        XLSX.utils.book_append_sheet(workbook, sheet4, "Additional Student Information");
    }
    return workbook;
};
const createSampleWorkbook = ({ tableData }) => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    if (tableData) {
        // Create a worksheet for Sheet 2
        const sheet2 = XLSX.utils.aoa_to_sheet(tableData);
        const colWidths2 = [
            { wch: 50 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 30 }, // Width of column B (Age)
        ];
        // Apply column widths to the worksheet
        sheet2['!cols'] = colWidths2;
        // Add Sheet 2 to the workbook
        XLSX.utils.book_append_sheet(workbook, sheet2, 'Sample learner group data');
    }
    return workbook;
};
const handleExport = async ({ name, statsData, tableData, reviewData, assessmentData, additionalQuestionsData }) => {
    // Create the workbook
    const projectRoot = process.cwd();
    const workbook = createWorkbook({ statsData, tableData, reviewData, assessmentData, additionalQuestionsData });
    const filePath = path_1.default.join(projectRoot, "generated-files", `${name}.xlsx`);
    // Save the workbook to a file
    if (!(0, fs_1.existsSync)(path_1.default.join(projectRoot, "generated-files"))) {
        (0, fs_1.mkdirSync)(path_1.default.join(projectRoot, "generated-files"));
    }
    try {
        await XLSX.writeFile(workbook, filePath);
    }
    catch (error) {
        console.log("write error=>", error);
    }
    return filePath;
};
exports.handleExport = handleExport;
const exportSampleData = ({ name, tableData }) => {
    // Create the workbook
    const workbook = createSampleWorkbook({ tableData });
    // Save the workbook to a file
    XLSX.writeFile(workbook, `${name}.xlsx`);
};
exports.exportSampleData = exportSampleData;
//# sourceMappingURL=generateExcelSheet.js.map