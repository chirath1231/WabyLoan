/** Maps a Prisma Bank row to the shape @wabyloan/engine expects (Decimal -> number, etc). */
export function mapBank(b) {
  return {
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    type: b.type,
    active: b.active,
    sponsored: b.sponsored,
    baseRate: Number(b.baseRate),
    docChargePct: Number(b.docChargePct),
    docChargeMin: b.docChargeMin,
    docChargeCap: b.docChargeCap,
    maxTermYears: {
      personal: b.maxTermPersonal,
      professional: b.maxTermProfessional,
      housing: b.maxTermHousing,
      vehicle: b.maxTermVehicle,
      business: b.maxTermBusiness,
    },
    specialRate: b.specialRate != null ? Number(b.specialRate) : null,
    specialDocChargePct: b.specialDocChargePct != null ? Number(b.specialDocChargePct) : null,
    specialMaxTermYears: b.specialMaxTermYears,
    allowedSectors: b.allowedSectors,
    targetOccupation: b.targetOccupation ?? 'all',
    remarks: b.remarks,
    specialSchemeRemarks: b.specialSchemeRemarks,
    color: b.color,
    updatedDate: b.updatedDate.toISOString().slice(0, 10),
  };
}

export function mapOccupation(o) {
  return { id: o.slug, label: o.label, isSpecialSchemeEligible: o.isSpecialSchemeEligible };
}

export function mapSettings(s) {
  return {
    dtiBySector: {
      government: s.dtiGovernment,
      semi_government: s.dtiSemiGovernment,
      private: s.dtiPrivate,
      self_employed: s.dtiSelfEmployed,
    },
    specialOccupationDiscount: Number(s.specialOccupationDiscount),
    specialOccupationEnabled: s.specialOccupationEnabled,
    professionalSchemeDiscount: Number(s.professionalSchemeDiscount),
    professionalSchemeEnabled: s.professionalSchemeEnabled,
    loanRoundingStep: s.loanRoundingStep,
    businessLoanEnabled: s.businessLoanEnabled,
  };
}
