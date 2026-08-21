import { prisma } from '../db/prisma.js';

export function createLead(input) {
  return prisma.lead.create({ data: input });
}

export function createCallbackRequest(input) {
  return prisma.callbackRequest.create({ data: input });
}

/** Combined table for the Admin Console dashboard (SRS §5.4), tagged Full vs Callback. */
export async function listAllLeadsCombined() {
  const [leads, callbacks] = await Promise.all([
    prisma.lead.findMany({ include: { bank: true }, orderBy: { createdAt: 'desc' } }),
    prisma.callbackRequest.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  const tagged = [
    ...leads.map((l) => ({
      id: l.id,
      type: 'full',
      name: l.name,
      phone: l.phone,
      city: l.city,
      bankName: l.bank?.name ?? null,
      loanCategory: l.loanCategory,
      requestedAmount: l.requestedAmount,
      createdAt: l.createdAt,
    })),
    ...callbacks.map((c) => ({
      id: c.id,
      type: 'callback',
      name: c.name,
      phone: c.phone,
      city: null,
      bankName: null,
      loanCategory: c.loanCategory,
      requestedAmount: null,
      createdAt: c.createdAt,
    })),
  ];

  return tagged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
