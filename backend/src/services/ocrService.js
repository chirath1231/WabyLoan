import { GoogleGenerativeAI } from '@google/generative-ai';

const EXTRACTION_PROMPT = `You are extracting structured data from a Sri Lankan payslip image for a loan
eligibility application. Return ONLY valid JSON (no markdown fences, no commentary) matching this shape:
{
  "employee": { "name": string, "employer": string, "designation": string, "period": string },
  "items": [
    { "label": string, "type": "earning" | "deduction", "amount": number }
  ]
}
Include every earning line (Basic Salary, allowances, OT, bonuses) and every deduction line (EPF, APIT/tax,
loan deductions, etc.) you can read. Use 0 for amounts you cannot read clearly rather than guessing wildly.
If a field is illegible, use an empty string. Do not invent employers or names that aren't visible.`;

// Mock provider (default / no API key) — mirrors the prototype's hardcoded
// simulateExtraction() so the upload flow works end-to-end without external calls.
function mockExtract() {
  return {
    employee: { name: 'K.A.D. Perera', employer: 'Zenith Logistics (Pvt) Ltd', designation: 'Senior Executive', period: 'June 2026' },
    items: [
      { label: 'Basic Salary', type: 'earning', amount: 145000 },
      { label: 'Transport Allowance', type: 'earning', amount: 15000 },
      { label: 'Attendance Allowance', type: 'earning', amount: 8000 },
      { label: 'EPF (Employee 8%)', type: 'deduction', amount: 14000 },
      { label: 'APIT / Tax', type: 'deduction', amount: 6200 },
    ],
  };
}

async function geminiExtract(fileBuffer, mimeType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    { inlineData: { data: fileBuffer.toString('base64'), mimeType } },
  ]);

  const text = result.response.text().trim().replace(/^```json\s*/i, '').replace(/```$/, '');
  const parsed = JSON.parse(text);
  return parsed;
}

export async function extractPayslip(fileBuffer, mimeType) {
  const provider = process.env.OCR_PROVIDER || 'mock';
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.');
    return geminiExtract(fileBuffer, mimeType);
  }
  return mockExtract();
}
