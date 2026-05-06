"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const attendant_extraction_1 = require("../../modules/attendant-extraction");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/tmp' });
router.post('/', upload.single('image'), attendant_extraction_1.attendantExtractionController.createExtraction);
router.get('/', attendant_extraction_1.attendantExtractionController.listExtractions);
router.get('/:id', attendant_extraction_1.attendantExtractionController.getExtraction);
exports.default = router;
//# sourceMappingURL=attendant-extraction.route.js.map