import { env } from '../env.js';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * Simulated extraction with static values, matching the validated prototype's placeholder
 * payslip shape (SRS §2.5 / Appendix C.8) — the buffer is read only in memory and never
 * persisted, so swapping in a real provider later doesn't regress the zero-retention rule.
 */
const mockProvider = {
  async extract(_fileBuffer, _mimeType) {
    return {
      employeeName: 'K.A.D. Perera',
      employer: 'Zenith Logistics (Pvt) Ltd',
      designation: 'Senior Executive',
      payPeriod: new Date().toISOString().slice(0, 7),
      confidence: 0.92,
      items: [
        { id: 'basic', label: 'Basic Salary', type: 'earning', fixed: true, amount: 145000 },
        { id: 'transport', label: 'Transport Allowance', type: 'earning', fixed: false, amount: 15000 },
        { id: 'attendance', label: 'Attendance Allowance', type: 'earning', fixed: false, amount: 8000 },
        { id: 'epf_emp', label: 'EPF (Employee 8%)', type: 'deduction', fixed: true, amount: 14000 },
        { id: 'apit', label: 'APIT / Tax', type: 'deduction', fixed: true, amount: 6200 },
      ],
    };
  },
};

const GEMINI_MODEL = 'gemini-3.6-flash';

const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    employeeName: { type: 'STRING', nullable: true },
    employer: { type: 'STRING', nullable: true },
    designation: { type: 'STRING', nullable: true },
    payPeriod: { type: 'STRING', nullable: true },
    confidence: { type: 'NUMBER' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          label: { type: 'STRING' },
          type: { type: 'STRING', enum: ['earning', 'deduction'] },
          fixed: { type: 'BOOLEAN' },
          amount: { type: 'NUMBER' },
        },
        required: ['id', 'label', 'type', 'fixed', 'amount'],
      },
    },
  },
  required: ['items', 'confidence'],
};

const GEMINI_PROMPT = `You are reading a Sri Lankan salary payslip (image or PDF). Extract every earning and deduction line item.
Rules:
- "type" is "earning" for income lines (Basic Salary, allowances, bonuses, overtime) and "deduction" for withholdings (EPF employee share, ETF, APIT/income tax, loan repayments, etc.).
- The Basic Salary line must use id "basic", type "earning", fixed true.
- Statutory deductions (EPF employee contribution, APIT/income tax) are fixed true; every other line is fixed false.
- amount is a plain number in LKR — no currency symbol, commas, or units.
- id is a short unique lowercase slug per item (e.g. "basic", "transport_allowance", "epf_emp").
- employeeName/employer/designation/payPeriod: read from the document if visible, else null. payPeriod as "YYYY-MM" if a month and year are visible.
- confidence: your 0-1 confidence that this is a genuine payslip and the figures were read correctly. If the document is not a payslip, return an empty items array and confidence 0.
Return only the extracted data — no commentary.`;

function normalizeItems(rawItems) {
  const seenIds = new Set();
  return (Array.isArray(rawItems) ? rawItems : []).map((it, idx) => {
    let id = String(it?.id || `item_${idx}`)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_');
    if (seenIds.has(id)) id = `${id}_${idx}`;
    seenIds.add(id);
    return {
      id,
      label: String(it?.label || 'Item'),
      type: it?.type === 'deduction' ? 'deduction' : 'earning',
      fixed: Boolean(it?.fixed),
      amount: Number(it?.amount) || 0,
    };
  });
}

const geminiProvider = {
  async extract(fileBuffer, mimeType) {
    if (!env.geminiApiKey) {
      throw new HttpError(500, 'Payslip AI extraction is not configured on this server (missing GEMINI_API_KEY).');
    }

    const body = {
      contents: [
        {
          parts: [{ text: GEMINI_PROMPT }, { inline_data: { mime_type: mimeType, data: fileBuffer.toString('base64') } }],
        },
      ],
      generationConfig: { responseMimeType: 'application/json', responseSchema: GEMINI_RESPONSE_SCHEMA },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      throw new HttpError(502, err.name === 'AbortError' ? 'Payslip extraction timed out. Please try again.' : 'Could not reach the payslip extraction service.');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      console.error('Gemini OCR error', res.status, await res.text().catch(() => ''));
      throw new HttpError(502, 'Payslip extraction failed. Please try again or enter your income manually.');
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new HttpError(502, 'Payslip extraction failed — no readable result. Please try again or enter your income manually.');

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HttpError(502, 'Payslip extraction failed — no readable result. Please try again or enter your income manually.');
    }

    return {
      employeeName: parsed.employeeName ?? null,
      employer: parsed.employer ?? null,
      designation: parsed.designation ?? null,
      payPeriod: parsed.payPeriod ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      items: normalizeItems(parsed.items),
    };
  },
};

const providers = {
  mock: mockProvider,
  gemini: geminiProvider,
  // 'textract' / 'document-ai': wire another real provider here later — same interface.
};

export function getOcrProvider() {
  return providers[env.ocrProvider] ?? mockProvider;
}
