# Waby Loan — Prototype Spec (`waby-loan (13) (1).html`)

Source: single-file HTML/CSS/JS prototype, 4174 lines. `<div id="app"></div>` is the only body content — **the entire UI is client-rendered by one big `<script>` block** (no server, no routing, no build step). This doc is the reference for rebuilding `frontend/src` (Next.js) and `backend/src` (Express) to match it, reusing `packages/engine` and `backend/scripts/schema.sql` where they already fit, and flagging where they don't.

---

## 1. Overall structure

- One root `state` object drives everything; `render()` wipes `#app` and rebuilds it from scratch every time (`root.innerHTML=''` then re-append). No virtual DOM — direct `el(templateString)` + `appendChild`.
- Top-level split: `state.view` is `'user'` or `'admin'`. `renderHeader()` always renders; below it, either `renderAdminPanel()` or `renderStepper()` + `renderStepBody()`.
- Wizard: `state.step` 1–5, dispatched via `renderStep1..5()`. Category-specific step 3/4 content is chosen by JS branching (not sub-routes).
- Modals/drawers (auth panel, bank detail modal, compare modal, bank/product admin drawers, helper video modal) are appended directly to `document.body` (fixed overlay + backdrop), not part of the `#app` tree — closed by removing the DOM node.
- No client-side router at all; nothing is a URL — reproduce with React state (step index, view, modal-open flags), not Next.js routes, to match behavior 1:1. (Admin could still live at `/admin` as a distinct Next.js route per the current README/architecture — the prototype just doesn't model that separation.)

## 2. Design system

CSS variables on `:root`, overridden wholesale on `body.theme-dark` (dark is the **default** theme: `state.theme = 'dark'`).

**Light tokens:**
```
--ink-900:#0A2E2A; --ink-700:#134E48;
--teal-900:#00352F; --teal-800:#00453D; --teal-700:#00695C; --teal-600:#0C8577;
--teal-100:#DCEFEC; --teal-50:#F2F8F7;
--paper:#F7F9F8; --card:#FFFFFF;
--gold-700:#8A6D1D; --gold-600:#B4922D; --gold-100:#FBF3DD;
--danger:#B3261E; --danger-100:#FBEAE9;
--amber-700:#9A5B13; --amber-100:#FDF0DF;
--violet-700:#5B3B9E; --violet-100:#EFE9FB;
--line:#E4E9E7; --text-900:#132420; --text-600:#4B615C; --text-400:#7E938D;
--adm-bg:#F7F9F8; --adm-bg-alt:#EFF4F2; --adm-surface:#FFFFFF; --adm-surface-2:#F7F9F8;
--adm-border:#E4E9E7; --adm-accent:#00695C; --adm-accent-2:#0C8577;
--adm-text:#132420; --adm-text-dim:#4B615C; --adm-danger:#B3261E; --adm-amber:#9A5B13;
```
**Dark overrides (`body.theme-dark`)**, one central switch covering the whole app (public + admin share the same tokens):
```
--teal-900:#E5F5F1; --teal-800:#14B8A6; --teal-700:#10B981; --teal-600:#14B8A6;
--teal-100:rgba(16,185,129,0.16); --teal-50:rgba(16,185,129,0.08);
--paper:#0D1B18; --card:#122421; --line:#1B3330;
--text-900:#E5F5F1; --text-600:#7A9992; --text-400:#7A9992;
--gold-100:rgba(245,158,11,0.16); --gold-700:#FBBF24; --gold-600:#FBBF24;
--amber-100:rgba(245,158,11,0.14); --amber-700:#F59E0B;
--violet-100:rgba(139,92,246,0.16); --violet-700:#C4B5FD;
--danger-100:rgba(248,113,113,0.14); --danger:#F87171;
--adm-bg:#081311; --adm-bg-alt:#0D1B18; --adm-surface:#122421; --adm-surface-2:#0F1E1B;
--adm-border:#1B3330; --adm-accent:#10B981; --adm-accent-2:#14B8A6;
--adm-text:#E5F5F1; --adm-text-dim:#7A9992; --adm-danger:#F87171; --adm-amber:#F59E0B;
```
Also in dark mode: inputs/selects/textareas get `background:var(--card)`, placeholder opacity 0.7, `.badge-grey` recolored, table header bg swapped, `.btn-ghost`/`.btn-primary`/`::selection` recolored, header backdrop darkened, and the `<select>` arrow SVG is swapped to a light-fill version (a hardcoded-color data-URI can't respond to CSS vars).

**Fonts:** Inter (400/500/600/700/800) body, Sora (500–800) as `.font-display` (headings/brand), IBM Plex Mono (500–700, tabular-nums) as `.font-mono` (all money/number figures). Font Awesome 6.5.1 for icons (not Lucide, despite `frontend/package.json` having `lucide-react` — **prototype uses `<i class="fa-solid ...">`/`fa-brands` throughout, would need Font Awesome or an icon-mapping pass to Lucide**). Tailwind CDN (`cdn.tailwindcss.com`) for layout utilities, all custom design-system CSS hand-written in a `<style>` block (not Tailwind config).

**Radii/spacing:** cards `border-radius:16px` (`.card`), buttons/inputs `10px`, badges/pills `999px` (full), choice-cards `14px`, drawers full-height slide-over `max-width:1024px`. Standard control height `42px` (inputs/selects), compact admin/product-accordion fields `34px`.

**Component patterns:**
- `.card` — white/dark surface, 1px `--line` border, 16px radius.
- `.choice-card` — selectable card (loan category, sector), hover lift + shadow, `.selected` = teal border + teal-50 bg + ring, `.disabled-card` for "Coming Soon" (Business Loan when feature-flagged off).
- `.btn-primary` (solid teal, hover darkens + lifts, disabled = gray `#B9C7C4`), `.btn-ghost` (bordered, hover teal border+text), `.btn-whatsapp` (`#25D366`), `.btn-social` (auth provider buttons).
- `.badge` variants: gold (best offer), teal, danger, amber, violet (special/discounted scheme), grey. Small pill, 11px bold uppercase-ish.
- `.toggle` — 44×24px pill switch with sliding `.dot`, `.on` = teal bg + dot slides right. Used everywhere (joint applicant, balloon payment, itemize, business loan flag, bank active/sponsored).
- `input[type=range]` — custom teal thumb (18px circle, white border + teal ring).
- `.stamp` — 44px circular step-number badge for the stepper: default/active (teal ring + scale+rotate)/done (solid teal + dashed outer ring, rotated).
- `.ledger-line` — connecting line between stamps, fills teal via `--fill` CSS var + transition as steps complete.
- `.stat-tile` — small metric box (`background:var(--teal-50)`, dark mode `#112623`), used for all the small figure callouts (EMI, doc charge, etc.).
- `.modal-backdrop`/`.modal-panel` — blurred dark backdrop + scale/translateY-in modal (`modalIn` keyframe).
- `.drawer-panel` — full-height right-side slide-over (`drawerIn` keyframe, translateX), used for admin bank/product editors.
- `.rank-pill` — small square numbered badge (1st/2nd/... ranking) on results.
- `.best-glow` (gold ring + shadow), `.sponsor-glow` (grey ring), `.scheme-glow` (violet ring) — card highlight treatments.
- `.tooltip-trigger`/`.tooltip-bubble` — hover info icon, dark bubble tooltip above trigger.
- `.item-row` — grid row for payslip line items (checkbox / label / fixed-badge / earning-deduction badge / amount), responsive column collapse under 640px.
- `.skeleton` — shimmer loading placeholder (OCR "extraction in progress").
- Admin-specific: `.admin-shell`, `.admin-card`, `.admin-nav-link` (`.active` = teal-tinted bg), `.admin-input`/`.admin-select`, `.admin-badge-*`, `.admin-btn-primary`/`.admin-btn-ghost`, `.admin-table`, `.admin-dashboard-card` (hoverable), `.admin-tab` (pill tabs).
- Print: `#printArea{display:none}` except `@media print` where everything else is hidden and only `#printArea` shows — used for "print amortization schedule".

## 3. Public wizard flow

State fields relevant to the wizard (see full `state` object in §9 below for exact shape).

### Step 1 — Loan category (`renderStep1`)
Grid of choice-cards, single-select into `state.loanCategory`:
| id | title | desc |
|---|---|---|
| personal | Personal Loan | "For medical, wedding, or urgent cash needs. Doctors, Engineers & other eligible professions automatically see a discounted scheme too." |
| housing | Housing Loan | "To buy land, build, or renovate." |
| vehicle | Vehicle Leasing | "For cars, vans, or bikes." |
| pension | Pension Loan | "For retirees borrowing against a pension income." |
| business | Business Loan | "For stock, equipment, or growing your business." — disabled/"COMING SOON" badge unless `state.admin.featureFlags.businessLoanEnabled` |

**Important**: `professional` is *not* a user-selectable category anymore (contrary to `packages/engine`'s `LoanCategory` type which still has `'professional'` as a pickable category and no `'pension'`). Eligible professions (Doctor, Engineer, Accountant/CA/ACCA, Gov Exec, Lawyer) are auto-detected while on **Personal Loan** and get a `dualSchemeMode` (see §6) showing both a discounted Special Scheme and the General Scheme. `'professional'` survives only as an internal term-cap/category key for admin configuration.

### Step 2 — Profile (`renderStep2`)
- **Employment sector** (choice-cards, single-select → `state.sector`): `government` / `semi_government` / `private` / `self_employed`. Selecting a sector auto-fills `state.applicant.retirementAge` from `RETIREMENT_AGE_DEFAULT = {government:60, semi_government:60, private:60, self_employed:65}` unless the user already typed a custom value (`retirementAgeCustom` flag).
- **Occupation** (`<select>` → `state.occupation`, options from `state.admin.occupations`). If `general` ("Other / Custom") selected, shows a free-text "Your exact job title" input (`state.applicant.customOccupation`).
- Occupation note box: if occupation is `special:true` → violet callout "You may qualify for a discounted Special Scheme... we'll automatically show you both a bank's discounted Special Scheme and its standard General Scheme side by side in Step 5." Else plain "Standard interest rates will apply."
- **Gender** (optional, two pill buttons Female/Male + Clear) → `state.applicant.gender`. Tooltip: "Only used to show you special women-only loan schemes... Skip this if you'd rather not say."
- **Employer name** (optional text) + **Time in current job** (optional number, months) — hidden entirely when `sector === 'self_employed'`. Tooltip on employer: "Some banks offer better rates to employees of specific companies. We'll check this automatically."
- **Age & Retirement** box (teal-tinted): Applicant age (number, 18–`maxValidApplicantAge()` = 85 for pension else 70) + "When do you plan to retire?" (or "Maximum age for this loan" if `loanCategory==='pension'`, defaulting from `state.admin.pensionMaxAge`, default 80). Live hint box below computes remaining years and shows danger/amber/plain state (retirement reached / ≤5 years left / plain remaining-years message).
- **Joint applicant** toggle — **Housing Loan only** (`state.loanCategory==='housing'`), combines co-applicant income; resets to false if category changes away from housing. Note: engine's current `jointApplicant` logic applies to *all* categories except business — prototype restricts it to Housing only.
- Continue enabled once `sector && occupation && isValidAge(age)`.

### Step 3 — Income (branches on category/sector, `renderStep3` dispatcher)
- **Business** (`renderStep3Business`): Average Monthly Revenue + Average Monthly Expenses (money inputs) → live "Net Monthly Profit" stat tile (red if negative).
- **Pension** (`renderStep3Pension`): single "Average monthly pension income" money input. Hint: needs pension payment book/bank statement at application.
- **Self-employed** (`renderStep3SelfEmployed`, any category when `sector==='self_employed'`): single "Average monthly income (last 6 months)" money input. Hint: bank statements + business registration needed.
- **Payslip** (`renderStep3Payslip`, everyone else): two tabs — **Upload Slip (AI OCR)** vs **Enter Manually**, plus a "Watch 1-min Helper Video" link opening a modal explaining Fixed vs Non-Fixed income (mock video player, real explainer text — see §7 OCR/help modal). A trilingual (all 3 languages shown at once, not switched) privacy notice is always shown under either mode.
  - **Upload mode**: dashed dropzone; click simulates upload+OCR (`simulateExtraction()`, 1.1s `setTimeout`) → loading skeleton → extraction result: employee/employer/designation/pay-period stat tiles + editable/checkable line-items table (`state.payslip.items`, each `{id,label,type:'earning'|'deduction',fixed,amount,checked,locked}` — locked items like Basic Salary/EPF/APIT can't be unchecked) with live Gross Earnings / Total Deductions / Net Take-Home summary tiles.
  - **Manual mode** (`state.payslip.manual`): "Simple mode" (default, on) = single Net Monthly Salary input. Toggling off "simple mode" reveals: Basic Salary (fixed) + Allowances/Deductions either as lump sums or itemized (toggle) line-item lists with add/remove rows (`allowanceItems`/`deductionItems`, each `{id,label,amount,checked}`); live warning if deductions > gross; live Gross/Net summary tiles. Independent of simple/detailed mode: **Average monthly OT** (optional) and **Other monthly income** (optional) money inputs always shown — feed `state.otMonthlyAverage` / `state.otherIncomeMonthly`, applied per-product based on that product's `otIncluded`/`otherIncomePct` (see §6).
- Continue enabled once net salary/basic (or OCR extraction) is > 0.

### Step 4 — Category-specific details (`renderStep4`)
Common to all: obligations question ("Do you currently pay any monthly loan or credit card installments?" Yes/No pill buttons) → if Yes, "Current Monthly Loan/Card Payments" input (`state.existingObligations`) + conditional "I will pay off these old loans using this new loan" checkbox (`state.settleExistingLoans`) which reveals "Outstanding balance to settle" (`state.existingLoanBalance`) — settling excludes the obligation from affordability math and computes `netCashInHand` on results.

Category-specific fields (`fields` grid):
- **Vehicle**: Valuation (money), Manufacturing Year (number, 1980–current year, validated), Down payment % slider (10–50 step 5), Target Loan Term slider (1–7 yrs), Balloon Payment toggle. Warns if vehicle age > 15 years (hard ineligibility later).
- **Housing**: Property Value (money), Target Term slider (5–30 yrs), Down payment % slider (10–50 step 5), live "Est. Legal & Valuation Fee" stat tile (`min(propertyValue * legalFeePct/100, legalFeeCap)`, defaults 0.3% / cap 100,000).
- **Business**: Target Loan Term slider (1–7 yrs) only.
- **Personal / Pension** (else branch): Target Loan Term slider, max = 6 for pension, 8 for eligible-profession personal (dual-scheme), else 5.
- Age-cap warnings (retirement-limit reached → danger box; <5 years left → amber box with capped tenure) shown for every category via shared `checkWarnings()`.
- Continue → "See eligible banks" runs the engine and goes to Step 5.

### Step 5 — Results (see §4)

## 4. Results screen (`renderStep5` / `renderStep5Guest`)

Runs `runEligibilityEngine()` (see §6) fresh on every render (also re-run twice more per render to compute the *true unrestricted max loan* ignoring any custom requested amount, used as the amount-slider ceiling).

**Top summary card**: "Quick Summary" mini-panel — 🏆 Lowest EMI bank + 💰 Highest Loan Amount bank (only if any eligible results). Header with step title, category+sector context line (+ "Professional scheme rate applied" / "Joint applicant income combined" flags), Back button.

**Controls row**: Target Loan Amount slider (range: 100,000 → true max across banks, step = rounding step or 50,000; sitting at max = "use full eligibility", else caps every bank's offer at that requested amount) + Tenure Preference slider (1 → longest term any active bank offers for this category). Settlement-mode banner if applicable.

**Bank cards** (`bankCardMarkup`), sorted by `totalCostOfCredit` ascending, ineligible ones pushed to the bottom as greyed "Not eligible" rows with the reason text:
- Rank pill, bank name, badges: variant label (violet if `schemeApplied` else grey), 🔥 PROMOTIONAL RATE, ⭐ PREFERRED EMPLOYER, 👑 BEST OFFER (gold, idx 0), FINANCE CO., CAPPED BY DOWN PAYMENT, ⚠️ shortfall warning, "Rates Effective: {date} (Live)".
- 4-stat grid: Max Eligible Loan (* if rounding active, "(Your Target)" if capped by request), Interest Rate, Est. Monthly EMI, Total Cost of Credit.
- Down payment + legal fee line (vehicle/housing).
- Net cash-in-hand box (settlement mode) — green/positive or red/shortfall framing.
- Remarks line (guarantor/eligibility remarks joined by " · ").
- "+ Compare" checkbox (max 3 selections, `state.compareSelection`), "Check Full Details" button opens `openBankModal(r)`.
- Best offer gets `.best-glow` gold ring; scheme-applied (non-best) gets `.scheme-glow` violet ring.

**Sponsored section**: banks with `sponsored:true` that are eligible get a "FEATURED PARTNER — sponsored placement, not part of the ranked comparison" section above the main list (deduped to one variant per bank, its cheapest).

**Empty state**: if zero eligible results at all — headset icon, "No banks currently match this profile" + "Talk to a consultant" CTA opening the soft-lead form.

**Soft lead card**: always shown below the list — "Send via WhatsApp" (`wa.me` deep link with prefilled best-offer summary text) + "Request a callback" (reveals inline name+phone form, validated against `/^0\d{9}$/`, pushes to `state.softLeads`).

### Guest mode (`isRestricted()` = no auth or `auth.provider==='guest'`)
Contrary to the README's "guest sees only the single top result" description, **this build shows up to 4 eligible results with the bank name blurred (`filter:blur(5px)`) and a "🔒 Locked (Click to unlock)" badge**, term shown but "rate hidden", Max Loan and EMI stat tiles fully visible (numbers not hidden, only identity). Clicking any locked card or the top/bottom "Sign up to unlock" buttons opens the auth panel. If zero eligible, shows a lock-icon empty state instead. Always has a "Prefer to talk it through?" callback card. A sticky bottom `#guestUnlockBar` (teal-800 bg) is shown site-wide on step 5 while guest.

### Compare (`renderCompareBar` / `openCompareModal`)
Sticky bottom bar (shown when 2–3 selected, non-guest) with removable chips per selection + "Compare Selected (N)" button opening a modal table: rows = Max Loan / Monthly EMI / Interest Rate / "Guarantors / Remarks", columns = selected banks/variants.

### Bank detail modal (`openBankModal`)
Two tabs: **Overview** (principal/interest/doc-charge/EMI/total-outlay stat tiles, down payment+legal fee, net-cash-in-hand box, guarantor-remarks list (filtered to remarks containing "guarantor"), rate-shock table showing EMI at rate+1%/+2%, a "Milestone balance checker" with quick 1/3/5-year buttons + custom month input computing `balanceAfterPayments()`), and **Amortization Schedule** (`renderScheduleView`, toggle Monthly/Yearly, table with Payment/Interest/Principal/Balance columns built from month-by-month amortization — yearly is monthly data aggregated into 12-month buckets so the two views can never drift). "Print" triggers `printAmortizationSchedule()` which builds an isolated `#printArea` node and calls `window.print()`.

## 5. Auth (`renderAuthPanel`, header `authArea`)

Inline panel (not a true modal) shown below the header when `state.authPanelOpen`. Options: **Continue with Google** / **Continue with Facebook** (both just set `state.auth = {provider, name:'Demo User', email:'demo@waby.lk'}` — no real OAuth in the prototype), **Continue as Guest** (`{provider:'guest', name:'Guest', email:null}`), or email+password fields with a "Sign up with Email" button (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` + password length ≥ 6; auto-registers into `state.admin.users` on first use). Header shows either a "Sign in" ghost button (opens panel) or, once authed, an avatar-initials chip that signs out on click.

**Admin access** is gated purely by `isAdminUser()`: `admin@waby.lk` is always-admin (hardcoded safety net, can't be locked out); anyone else must have a matching `state.admin.users` row with `role==='admin'`. Admin-eligible header shows an "Admin Console" pill toggle (switches `state.view` between `'user'`/`'admin'`) plus name + Sign out; the toggle is entirely absent for non-admins (never even a locked/disabled state).

## 6. Admin console

Sidebar nav (persisted in `state.adminTab`): **Dashboard, Banks, Loan Products, Company Lists, Occupations, Settings, Leads, Users, Audit Log**, plus a "Back to site" link. Top toolbar: Export JSON (downloads `{banks, exportedAt}`), Import JSON (accepts either that export shape or a bare banks array), Reset to defaults (clears localStorage + reloads). Labeled "Admin Console · Simulation" badge.

- **Dashboard**: 8 clickable summary cards linking to each tab, each showing a live count (banks, total specialty products, company lists, leads+softLeads, users, audit entries).
- **Banks tab**: searchable/filterable (all/bank/finance) table — bank name+color dot+type badge+inactive badge, base rate, product count badge, sector-restriction badge, Active toggle, Sponsored toggle (both persist immediately), Edit Bank button. "Add a new bank" opens the bank drawer blank.
  - **Bank drawer** (`openBankDrawer`) fields: Name, Short label, Type (bank/finance), Rates effective date (free text like "Aug 07, 2026"); **Base Bank Parameters** box: Base rate %, Doc charge %, Doc charge min/cap (LKR), Max term per category grid (one number input per `LOAN_LABELS` key: personal/professional/housing/vehicle/business/pension, 0 = not offered), Remarks textarea (one per line); **Sector eligibility** checkboxes (Government/Semi-Gov/Private/Self-Employed, at least one required); Active + Sponsored checkboxes. Save validates name + ≥1 sector, generates `id:'bank_'+Date.now()` if new, calls `logAudit`, persists to localStorage. Legacy `targetOccupation`/`specialRate`/`specialDocChargePct`/`specialMaxTermYears`/`specialSchemeRemarks` fields are preserved-but-uneditable here (superseded by per-product fields, kept only for un-migrated bank fallback logic).
- **Loan Products tab**: flat cross-bank table (search + per-bank filter dropdown), columns Bank/Product/Category/Rate/Status/Edit+Delete. "Add Product" requires picking a specific bank in the filter first.
  - **Product drawer** (`openProductDrawer`) — the full ~44-field product editor, collapsible "⚙️ Advanced Settings" section. Primary: Name, Category (`LOAN_LABELS` minus `professional`), Interest rate %, Rate type (reducing_balance/flat/fixed/variable), Target occupation (select from `state.admin.occupations` + "All"), Max loan amount. Advanced, grouped:
    - *Status & targeting*: Status (active/suspended/promotional), Target gender (all/female/male), Currency (LKR/USD), Common Loan (open to all) checkbox.
    - *Income & qualification*: Repayment base % override (blank = bank/sector default DTI), OT included? (yes/no), Other income considered %, Min net monthly income.
    - *Eligibility & age caps*: Age min, Age max at maturity, Min employment (months), Max term override (blank = bank default), Requires approved employer? (yes/no) + Approved list dropdown (scoped to this bank's `companyLists`), Loan amount min.
    - *Fees & charges*: Doc charge basis (percent/fixed), Doc charge value, Doc charge min/max overrides.
    - *Leasing terms* (vehicle category only): Balloon payment allowed?, Balloon % of asset value.
    - *Risk & security*: Guarantor required (no/1/2), Collateral required (none/vehicle/property/fd), Insurance required (none/life/asset/both), CRIB check required?.
    - *Servicing terms*: Early settlement allowed? + charge %, Late payment penalty %, Grace period (days), Processing time (business days), Salary must credit to this bank?, Co-applicant allowed?, Top-up allowed after (months).
    - Remarks textarea (guarantor/approval conditions, one per line — these are what the bank-modal's "Guarantor & Approval Conditions" panel filters for).
    - Save/Delete both call `logAudit` + persist + re-render.
- **Company Lists tab**: grouped by bank, each an editable table of approved employer/hospital entries (`{name, tier, sector}`) — referenced by a product's `companiesListId` when `companiesListRequired`. **Not present in `backend/scripts/schema.sql`** — needs a new table/entity if this feature is to persist server-side.
- **Occupations tab**: minimal — just an editable label per occupation row + "Add occupation keyword" (defaults `special:false`). The `special` (dual-scheme-eligible) flag has **no UI toggle** in this build (contrary to `occupations.isSpecialSchemeEligible` being an admin-manageable column in schema.sql) — only settable via default data or JSON import in this prototype.
- **Settings tab**: Feature flags (Business Loan category toggle — "Coming Soon" gating), Loan limits & age caps (Loan Amount Rounding Step select: Exact/10k/50k/100k; Pension Loan max age cap number), DTI thresholds per sector (4 number inputs, government/semi_government/private/self_employed). Every change calls `logAudit`.
- **Leads tab**: single combined read-only table of `state.leads` (full leads) + `state.softLeads` (callback requests) — Name/Phone/Bank/Loan Type/Amount/Kind badge (Full=teal, Callback=amber). Nothing else editable here in this build (no delete/export).
- **Users tab**: table of `state.admin.users` (email/name/role badge), add-by-email button (defaults role to `'admin'` — note: **new users added via this form default to Admin**, not User — worth confirming intent before porting), per-row "Make Admin"/"Make User" toggle except the protected `admin@waby.lk` seed row.
- **Audit Log tab**: read-only table, most-recent-first, Timestamp/Admin(actor)/Action/Details. `logAudit(action, details)` capped at 300 entries, called on: bank add/edit, product add/edit/delete, user role change, feature flag change, rounding-step change, pension-max-age change, DTI change. (Not called for company-list edits, bank active/sponsored toggle, or occupation label edits in this build — inconsistent audit coverage worth normalizing server-side.)

## 7. OCR / payslip extraction UI

Entirely mocked client-side — no real OCR call. Click on the dropzone sets `uploaded=true`, shows a loading skeleton (4 shimmering placeholder tiles + "Running AI OCR extraction on payslip…" with a spinning chip icon), then after a **hardcoded 1100ms `setTimeout`**, flips `extracted=true` and renders the fixed mock result: employee `K.A.D. Perera`, employer `Zenith Logistics (Pvt) Ltd`, designation `Senior Executive`, period `June 2026`, and a fixed 9-item payslip breakdown (Basic Salary, Transport/Attendance Allowance, one-time Bonus, Overtime, EPF 8%, APIT/Tax, Existing Staff Loan Deduction, Party/Welfare Deduction — see exact values in `state.payslip.items` in §9). The real backend's `ocrService.js` (mock provider per README) should produce data in this same shape so the frontend component is a drop-in.

Helper video modal (`openHelperVideoModal`) — no real video asset, a gradient placeholder "player" (16:9, play icon, "Fixed vs Non-Fixed Income — explained", "1:00" duration label) plus a plain-language 3-bullet explainer list (verbatim, worth preserving): fixed income = Basic Salary counted 100%; non-fixed = allowances/OT/bonuses, worth double-checking one-time items; any item can be unchecked with instant recalculation.

## 8. i18n

`state.lang` ∈ `en`/`si`/`ta`, `<select id="langSelect">` EN / සිංහල / தமிழ். `I18N` object keyed by lang, ~35 string keys (`t(key)` helper falls back to `en`, then the raw key). Covers: tagline, admin console label, auth strings, all 5 step titles/labels/sub-copy, back/continue/CTA button labels, result-screen labels (max loan/rate/EMI/doc charge/total cost/best offer/not eligible/rates effective/target/shortfall/compare), guest-lock copy, footer disclaimer/privacy copy. **Explicitly NOT translated** (stays English regardless of `state.lang`, flagged in-code as "prototype — flagged for full localization before production"): OCR-extracted content, bank remarks/admin data, the entire Admin Console, the trilingual privacy notice (which instead shows all 3 languages simultaneously, not switched). Full EN/SI/TA string tables are in the source file lines 456–517 — copy exactly when building the real i18n resource files (`frontend/src/lib/i18n/{en,si,ta}.json` per the deleted-file list).

## 9. State shape (`const state = {...}`, prototype's "mock backend")

```js
state = {
  view: 'user'|'admin', lang, step: 1-5, theme: 'dark'|'light',
  loanCategory: null|'personal'|'housing'|'vehicle'|'pension'|'business',
  sector: null|'government'|'semi_government'|'private'|'self_employed',
  occupation: null|<occupation id>,
  auth: null | { provider:'google'|'facebook'|'guest'|'email', name, email },
  authPanelOpen: bool,
  applicant: { age, retirementAge, retirementAgeCustom, customOccupation, jointApplicant, coApplicantIncome, gender },
  payslip: { mode:'upload'|'manual', manual:{ simpleMode, simpleNetSalary, basic, allowances, deductions, itemized, allowanceItems[], deductionItems[] }, uploaded, extracted, employee:{name,employer,designation,period}, items[] },
  selfEmployedIncome, pensionIncome, otMonthlyAverage, otherIncomeMonthly, employerName, employmentMonths,
  business: { revenue, expenses },
  vehicle: { valuation, year, balloon, downPaymentPct },
  housing: { propertyValue, term, downPaymentPct, legalFeePct, legalFeeCap },
  termYears, requestedAmount, compareSelection: [variantKey],
  adminTab, adminBankSearch, adminBankFilter,
  existingObligations, hasExistingObligations, settleExistingLoans, existingLoanBalance,
  results: [], selectedBankId, leads: [], softLeads: [],
  admin: {
    banks: [...BANKS_DEFAULT], occupations: [...OCCUPATIONS_DEFAULT],
    dti: {government,semi_government,private,self_employed},
    featureFlags: { businessLoanEnabled: false },
    users: [{email,name,role}], loanRoundingStep: 0, pensionMaxAge: 80,
    companyLists: [...COMPANY_LISTS_DEFAULT], auditLog: [],
  },
}
```
Default users seeded: `admin@waby.lk`/Admin/admin, `demo@waby.lk`/Demo User/user. Default `loanRoundingStep` is **0 (exact, no rounding)** at boot even though the Settings UI's default *option* and `backend/scripts/schema.sql`'s column default is 50,000 — confirm which is intended before porting. Default theme is **dark**.

## 10. Prototype's own engine vs. `packages/engine` — key divergences

The prototype's `runEligibilityEngine()` / `evaluateVariant()` (lines 850–1166) is a materially more advanced, **per-product** engine than `packages/engine/src/eligibility.ts`'s current per-bank-variant model. Treat the prototype's version as the target behavior; the shared engine package needs to grow to match, not the other way around.

1. **New loan category `'pension'`** — not in `packages/engine`'s `LoanCategory` union. Needs adding end-to-end (types, schema `LoanCategory` enum, `maxTermYears`, UI).
2. **`'professional'` demoted** from a user-pickable category to an internal-only term-cap key. `dualSchemeMode` now triggers as `cat === 'personal' && isEligibleProfession()` (not `cat === 'professional'`).
3. **Per-product evaluation, not per-bank-variant.** Every active bank now has a list of *loan products* (`getBankProducts()`): always one synthesized "general" facility from the bank's base params, plus explicit `bank.products[]` entries (or, for banks not yet migrated to products, a legacy single "special scheme" fallback from `bank.specialRate` etc.). Each product carries its own: rate, term cap, DTI override, OT-inclusion, other-income %, doc charge (basis/value/min/max), target occupation (single or array) + target gender, age min + age-at-maturity max, min employment months, min net monthly income, loan amount min/max, "Common Loan" bypass flag, and an approved-companies-list gate. This is structurally identical to the already-defined `loan_products` table in `backend/scripts/schema.sql` — **the schema already anticipated this**; `packages/engine` has not caught up.
4. **Company/employer approved-lists** (`COMPANY_LISTS_DEFAULT`, `getCompanyList()`, `isPreferredEmployer` flag) — a wholly new entity/gate not present anywhere in the current schema or engine. Needs a new table (e.g. `company_lists` + `company_list_entries`, referenced by `loan_products.companiesListId`) plus admin CRUD and eligibility-check wiring (`state.employerName` matched case-insensitively against the list tied to a product's `companiesListRequired`).
5. **Gender targeting** (`product.targetGender`, `applicant.gender`) — optional filter, new field not in schema/engine.
6. **Flat-rate interest support** (`interestRateType === 'flat'`, `emiFromPrincipalFlat`/`reversePrincipalFromEMIFlat`) — `packages/engine/src/amortization.ts` needs to check for and support flat-rate math alongside the existing reducing-balance formulas (verify current file — not yet inspected in this pass, but the DB column `interestRateType` enum already includes `'flat'`).
7. **Per-product minimum net monthly income floor** — independent of the %-of-salary affordability cap, checked against `computeBaseIncome()` (not the OT/other-income-inflated qualifying income).
8. **Joint applicant restricted to Housing** in the prototype (`jointApplicantIncomeContribution()` returns 0 unless `loanCategory==='housing'`) vs. the current engine applying it to any category except business — confirm which is the intended final rule.
9. **Custom "requested amount" capping** (`cappedByRequest`) and the Step-5 amount/tenure sliders re-running the engine live — this interactive re-solve loop (mutate `state.requestedAmount`/`termYears`, rerun, diff against `trueMaxLoanAcrossBanks`) needs an equivalent client-side re-evaluation strategy against the real API (likely: call `/eligibility/evaluate` on slider `change`, debounced, or run the same engine logic isomorphically client-side against the fetched bank/product dataset like the prototype does — cheaper than a network round-trip per slider tick).
10. **Product amount ceiling** (`loanAmountMax`) simply **caps** (not an ineligibility), while **`loanAmountMin`** is a hard ineligibility once the computed amount falls under it — asymmetric by design, same pattern as the existing rounding-to-zero handling.
11. Ranking metric (`totalCostOfCredit = totalInterest + docCharge`, principal excluded) and the "round down to nearest configured increment, but a genuinely-eligible-but-sub-increment amount is a real ineligibility not silent zero" behavior are **unchanged** from `packages/engine` — those two rules carry over as-is.
12. Guest restriction differs from the README's claim: prototype shows **up to 4** eligible results with bank identity blurred (numbers visible), not a single top result with nothing else revealed. Decide which is the actual product requirement — the SRS reference in the backend README (`§6.2`) says "only returns the single top-ranked result" server-side, which is stricter than what this prototype's UI actually renders. If the SRS is authoritative, the guest UI should be dialed back to match it (or the SRS updated) — flag to the user/product owner.

## 11. Copy worth preserving verbatim

- Tagline: "WABYBIX AI · ELIGIBILITY ENGINE"
- Footer disclaimer: "Figures shown are indicative estimates for comparison only and do not constitute a formal loan offer. Final terms are subject to each bank's credit assessment."
- Footer privacy: "Your information is used only to calculate eligibility on this device and is never stored or shared without consent."
- Guest lock: "Sign up to unlock full bank comparisons and detailed amortization schedules" / "You are viewing a limited guest preview."
- Step 1 category descriptions (§3).
- Helper-video explainer bullets (§7).
- All I18N EN/SI/TA tables (source lines 456–517) — copy exactly, do not re-translate.
- WhatsApp share text template: `` `Waby Loan — ${category} comparison. Best offer: ${bank} at ${rate}% for ${amount}, EMI approx ${emi}/month.` `` (`wa.me/94770000000`).
