"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../../config/config"));
const validate_middleware_1 = __importDefault(require("../../modules/validate/validate.middleware"));
const auth_1 = require("../../modules/auth");
const attendant_extraction_1 = require("../../modules/attendant-extraction");
const attendant_extraction_2 = require("../../modules/attendant-extraction");
const router = express_1.default.Router();
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/tiff', 'application/pdf']);
const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.pdf']);
const upload = (0, multer_1.default)({
    dest: 'uploads/tmp',
    limits: {
        fileSize: 1024 * 1024 * config_1.default.attendanceExtraction.maxUploadMb,
    },
    fileFilter: (_req, file, callback) => {
        const extension = path_1.default.extname(file.originalname || '').toLowerCase();
        const isSupportedMimeType = allowedMimeTypes.has(file.mimetype);
        const isOctetStreamFallback = file.mimetype === 'application/octet-stream' && allowedExtensions.has(extension);
        if (!isSupportedMimeType && !isOctetStreamFallback) {
            callback(new Error('Only image and PDF uploads are supported'));
            return;
        }
        callback(null, true);
    },
});
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('attendance.write'), upload.single('image'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.createExtraction), attendant_extraction_1.attendantExtractionController.createExtraction);
router.post('/test/document-ai', upload.single('image'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.testDocumentAi), attendant_extraction_1.attendantExtractionController.testDocumentAi);
router.post('/test/pi', upload.single('image'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.testPi), attendant_extraction_1.attendantExtractionController.testPi);
router.get('/pending-review', auth_1.authenticate, (0, auth_1.authorize)('attendance.read'), attendant_extraction_1.attendantExtractionController.listPendingReviewExtractions);
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('attendance.read'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.listExtractions), attendant_extraction_1.attendantExtractionController.listExtractions);
router.get('/:id', auth_1.authenticate, (0, auth_1.authorize)('attendance.read'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.getExtraction), attendant_extraction_1.attendantExtractionController.getExtraction);
router.patch('/:id/correct', auth_1.authenticate, (0, auth_1.authorize)('attendance.write'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.correctExtraction), attendant_extraction_1.attendantExtractionController.correctExtraction);
router.post('/:id/approve', auth_1.authenticate, (0, auth_1.authorize)('attendance.write'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.approveExtraction), attendant_extraction_1.attendantExtractionController.approveExtraction);
router.get('/:id/export', auth_1.authenticate, (0, auth_1.authorize)('attendance.write'), (0, validate_middleware_1.default)(attendant_extraction_2.attendantExtractionValidation.exportExtraction), attendant_extraction_1.attendantExtractionController.exportExtraction);
exports.default = router;
//# sourceMappingURL=attendant-extraction.route.js.map