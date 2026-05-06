import express from 'express';
import multer from 'multer';
import { attendantExtractionController } from '../../modules/attendant-extraction';

const router = express.Router();
const upload = multer({ dest: 'uploads/tmp' });

router.post('/', upload.single('image'), attendantExtractionController.createExtraction);
router.get('/', attendantExtractionController.listExtractions);
router.get('/:id', attendantExtractionController.getExtraction);

export default router;
