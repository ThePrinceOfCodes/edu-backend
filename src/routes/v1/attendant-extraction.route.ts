import express from 'express';
import multer from 'multer';
import path from 'path';
import config from '../../config/config';
import validate from '../../modules/validate/validate.middleware';
import { authenticate, authorize } from '../../modules/auth';
import { attendantExtractionController } from '../../modules/attendant-extraction';
import { attendantExtractionValidation } from '../../modules/attendant-extraction';

const router = express.Router();
const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/tiff', 'application/pdf']);
const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.pdf']);

const upload = multer({
  dest: 'uploads/tmp',
  limits: {
    fileSize: 1024 * 1024 * config.attendanceExtraction.maxUploadMb,
  },
  fileFilter: (_req: any, file: any, callback: any) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const isSupportedMimeType = allowedMimeTypes.has(file.mimetype);
    const isOctetStreamFallback = file.mimetype === 'application/octet-stream' && allowedExtensions.has(extension);

    if (!isSupportedMimeType && !isOctetStreamFallback) {
      callback(new Error('Only image and PDF uploads are supported'));
      return;
    }

    callback(null, true);
  },
});

router.post(
  '/',
  authenticate,
  authorize('attendance.write'),
  upload.single('image'),
  validate(attendantExtractionValidation.createExtraction),
  attendantExtractionController.createExtraction
);
router.post(
  '/test/document-ai',
  upload.single('image'),
  validate(attendantExtractionValidation.testDocumentAi),
  attendantExtractionController.testDocumentAi
);
router.post(
  '/test/pi',
  upload.single('image'),
  validate(attendantExtractionValidation.testPi),
  attendantExtractionController.testPi
);
router.get(
  '/pending-review',
  authenticate,
  authorize('attendance.read'),
  attendantExtractionController.listPendingReviewExtractions
);
router.get('/', authenticate, authorize('attendance.read'), validate(attendantExtractionValidation.listExtractions), attendantExtractionController.listExtractions);
router.get('/:id', authenticate, authorize('attendance.read'), validate(attendantExtractionValidation.getExtraction), attendantExtractionController.getExtraction);
router.patch(
  '/:id/correct',
  authenticate,
  authorize('attendance.write'),
  validate(attendantExtractionValidation.correctExtraction),
  attendantExtractionController.correctExtraction
);
router.post(
  '/:id/approve',
  authenticate,
  authorize('attendance.write'),
  validate(attendantExtractionValidation.approveExtraction),
  attendantExtractionController.approveExtraction
);
router.get(
  '/:id/export',
  authenticate,
  authorize('attendance.write'),
  validate(attendantExtractionValidation.exportExtraction),
  attendantExtractionController.exportExtraction
);

export default router;
