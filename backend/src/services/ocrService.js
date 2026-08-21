import { env } from '../env.js';

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

const providers = {
  mock: mockProvider,
  // 'textract' / 'document-ai': wire a real provider here later — same interface.
};

export function getOcrProvider() {
  return providers[env.ocrProvider] ?? mockProvider;
}
