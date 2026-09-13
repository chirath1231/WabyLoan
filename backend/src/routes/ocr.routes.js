import { Router } from 'express';
import multer from 'multer';
import { extractPayslip } from '../services/ocrService.js';
import { optionalAuth } from '../middleware/auth.js';

export const ocrRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) {
      return cb(new Error('Only PNG, JPG, or WEBP images are supported.'));
    }
    cb(null, true);
  },
});

ocrRouter.post('/payslip', optionalAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const extracted = await extractPayslip(req.file.buffer, req.file.mimetype);
    res.json(extracted);
  } catch (err) {
    console.error('OCR extraction failed:', err);
    res.status(502).json({ error: 'Could not read this payslip. Please try a clearer photo or enter income manually.' });
  }
});
