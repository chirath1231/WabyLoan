import { Router } from 'express';
import multer from 'multer';
import { getOcrProvider } from '../services/ocrService.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

// Memory storage only — the buffer is never written to disk, and nothing keeps a reference to
// it past this request, enforcing the zero-retention rule for raw payslip images (SRS §2.6).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.post('/extract', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'No file uploaded.');
    const provider = getOcrProvider();
    const result = await provider.extract(req.file.buffer, req.file.mimetype);
    res.json(result);
    // req.file.buffer goes out of scope here and is garbage-collected — never persisted.
  } catch (err) {
    next(err);
  }
});

export default router;
