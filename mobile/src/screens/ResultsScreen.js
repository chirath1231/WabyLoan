import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, ScrollView, Linking, Pressable } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { StepHeader } from '../components/StepHeader';
import { Stepper } from '../components/Stepper';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { FormField } from '../components/FormField';
import { colors } from '../theme/colors';
import { useWizard, buildEligibilityInput } from '../context/WizardContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { fmtLkr } from '../lib/format';
import { buildContextLabel } from '../lib/context';
import { buildAmortizationSchedule, balanceAfterPayments } from '../lib/amortization';

const TERM_BOUNDS = {
  personal: [1, 8],
  professional: [1, 8],
  vehicle: [1, 7],
  business: [1, 7],
  housing: [5, 30],
};

const PHONE_RE = /^0\d{9}$/;

export function ResultsScreen({ navigation }) {
  const { state, setFields } = useWizard();
  const { t } = useLanguage();
  const [term, setTerm] = useState(state.requestedTermYears);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [callback, setCallback] = useState({ name: '', phone: '', status: 'idle' });

  const bounds = TERM_BOUNDS[state.loanCategory] || [1, 8];

  const runEvaluation = useCallback(
    async (overrideTerm) => {
      setLoading(true);
      setError('');
      try {
        const input = buildEligibilityInput({ ...state, requestedTermYears: overrideTerm ?? term });
        const data = await api.post('/eligibility/evaluate', input);
        setFields({ engineResult: data.engineResult, restricted: data.restricted, applicationId: data.applicationId });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('results.evalError'));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    runEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = state.engineResult?.results ?? [];
  const eligible = results.filter((r) => !r.ineligible);
  const ineligible = results.filter((r) => r.ineligible);

  const sponsoredStrip = useMemo(() => {
    if (state.restricted) return [];
    const seen = new Set();
    return eligible.filter((r) => {
      if (!r.sponsored || seen.has(r.bankId)) return false;
      seen.add(r.bankId);
      return true;
    });
  }, [eligible, state.restricted]);

  async function submitCallback() {
    if (!(callback.name.trim() && PHONE_RE.test(callback.phone))) return;
    setCallback((c) => ({ ...c, status: 'sending' }));
    try {
      await api.post('/leads/callback', {
        name: callback.name.trim(),
        phone: callback.phone,
        loanCategory: state.loanCategory,
        applicationId: state.applicationId ?? undefined,
      });
      setCallback((c) => ({ ...c, status: 'sent' }));
    } catch {
      setCallback((c) => ({ ...c, status: 'error' }));
    }
  }

  return (
    <ScreenContainer footer={<GhostButton title={t('results.startOver')} onPress={() => navigation.popToTop()} />}>
      <StepHeader step={5} title={t('results.title')} context={buildContextLabel(state, t)} />

      {state.restricted && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerTitle}>{t('results.guestBannerTitle')}</Text>
          <Text style={styles.guestBannerSub}>{t('results.guestBannerSubtitle')}</Text>
          <PrimaryButton title={t('results.signUpFree')} onPress={() => navigation.navigate('Register')} style={{ marginTop: 10 }} />
        </View>
      )}

      <View style={styles.termBox}>
        <Stepper
          label={t('results.termPreference')}
          value={term}
          min={bounds[0]}
          max={bounds[1]}
          unit=" yrs"
          onChange={(v) => {
            setTerm(v);
            runEvaluation(v);
          }}
        />
      </View>

      <View style={styles.callbackBox}>
        <Text style={styles.callbackTitle}>{t('results.callbackPrompt')}</Text>
        {callback.status === 'sent' ? (
          <Text style={styles.callbackSent}>{t('results.callbackSent')}</Text>
        ) : (
          <>
            <FormField
              placeholder={t('common.namePlaceholder')}
              value={callback.name}
              onChangeText={(txt) => setCallback((c) => ({ ...c, name: txt }))}
            />
            <FormField
              placeholder={t('common.phonePlaceholder')}
              keyboardType="phone-pad"
              value={callback.phone}
              onChangeText={(txt) => setCallback((c) => ({ ...c, phone: txt }))}
            />
            <PrimaryButton
              title={t('results.requestCallback')}
              onPress={submitCallback}
              disabled={!(callback.name.trim() && PHONE_RE.test(callback.phone)) || callback.status === 'sending'}
              loading={callback.status === 'sending'}
            />
            {callback.status === 'error' && <Text style={styles.errorText}>{t('common.genericError')}</Text>}
          </>
        )}
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.teal700} />
          <Text style={styles.loadingText}>{t('results.calculating')}</Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {sponsoredStrip.length > 0 && (
        <View style={{ gap: 12 }}>
          <Text style={styles.sectionLabel}>{t('results.featuredPartners')}</Text>
          {sponsoredStrip.map((r) => (
            <BankCard
              key={r.variantKey}
              result={r}
              restricted={false}
              onRequestInfo={() => setDetailTarget(r)}
              onSignUp={() => navigation.navigate('Register')}
            />
          ))}
        </View>
      )}

      <View style={{ gap: 12 }}>
        {eligible.map((r, i) => (
          <BankCard
            key={r.variantKey}
            result={r}
            rank={i + 1}
            restricted={state.restricted}
            onRequestInfo={() => setDetailTarget(r)}
            onSignUp={() => navigation.navigate('Register')}
          />
        ))}
      </View>

      {!state.restricted && ineligible.length > 0 && (
        <View style={{ gap: 12 }}>
          <Text style={styles.sectionLabel}>{t('results.notEligible')}</Text>
          {ineligible.map((r) => (
            <BankCard key={r.variantKey} result={r} restricted={false} />
          ))}
        </View>
      )}

      <BankDetailModal
        visible={Boolean(detailTarget)}
        result={detailTarget}
        loanCategory={state.loanCategory}
        applicationId={state.applicationId}
        onClose={() => setDetailTarget(null)}
      />
    </ScreenContainer>
  );
}

function BankCard({ result, rank, restricted, onRequestInfo, onSignUp }) {
  const { t } = useLanguage();
  const isBest = rank === 1;
  const masked = restricted && rank !== 1;

  return (
    <View style={[styles.card, isBest && styles.cardBest]}>
      <View style={styles.cardHeader}>
        {rank ? (
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>{rank}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <Text style={styles.bankName}>{result.bankName}</Text>
            {isBest && <Badge tone="teal">{t('results.bestOffer')}</Badge>}
            {result.sponsored && <Badge tone="grey">{t('results.sponsored')}</Badge>}
            {result.variantLabel && <Badge tone="grey">{result.variantLabel}</Badge>}
          </View>
          <Text style={styles.updatedText}>{t('results.ratesEffective', { date: result.updatedDate })}</Text>
        </View>
      </View>

      {result.ineligible ? (
        <Text style={styles.ineligibleText}>{result.ineligibleReason}</Text>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <Stat label={t('results.statMaxLoan')} value={masked ? '••••••' : fmtLkr(result.maxLoan)} />
            <Stat label={t('results.statInterestRate')} value={masked ? '••%' : `${result.rate}%`} />
            <Stat label={t('results.statEmi')} value={masked ? '••••••' : fmtLkr(result.emi)} />
            <Stat label={t('results.statTotalCost')} value={masked ? '••••••' : fmtLkr(result.totalCostOfCredit)} />
          </View>
          {result.termCapReason && (
            <Text style={styles.capText}>
              {t('results.termCapReason', { years: result.termYears, reason: result.termCapReason })}
            </Text>
          )}
          {masked ? (
            <GhostButton title={t('results.signUpUnlock')} onPress={onSignUp} style={{ marginTop: 8 }} />
          ) : onRequestInfo ? (
            <GhostButton title={t('results.viewDetails')} onPress={onRequestInfo} style={{ marginTop: 8 }} />
          ) : null}
        </>
      )}
    </View>
  );
}

function Stat({ label, value, hint }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

const TABS = ['overview', 'amortization', 'guarantor'];

function BankDetailModal({ visible, result, loanCategory, applicationId, onClose }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('overview');
  const [milestone, setMilestone] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (visible) {
      setTab('overview');
      setMilestone(1);
      setName('');
      setPhone('');
      setStatus('idle');
    }
  }, [visible]);

  const schedule = useMemo(() => {
    if (!result || !result.maxLoan || !result.rate || !result.termYears) return [];
    return buildAmortizationSchedule(result.maxLoan, result.rate, result.termYears);
  }, [result]);

  const milestoneBalance =
    result && result.maxLoan && result.rate && result.termYears
      ? balanceAfterPayments(result.maxLoan, result.rate, result.termYears * 12, milestone * 12)
      : 0;

  if (!result) return null;
  const valid = name.trim().length > 0 && PHONE_RE.test(phone);
  const shortfall = result.netCashInHand != null && result.netCashInHand < 0;

  async function submit() {
    if (!valid) return;
    setStatus('sending');
    try {
      await api.post('/leads', {
        name: name.trim(),
        phone,
        loanCategory,
        applicationId: applicationId ?? undefined,
        bankId: result.bankId,
        variantKey: result.variantKey,
        requestedAmount: result.maxLoan,
      });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  function shareWhatsapp() {
    const text = `${result.bankName}${result.variantLabel ? ` (${result.variantLabel})` : ''}: ${fmtLkr(result.maxLoan)} at ${result.rate}% — est. EMI ${fmtLkr(result.emi)}/mo. Compared on Waby Loan.`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {});
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{result.bankName}</Text>
          <View style={styles.badgeRow}>
            {result.variantLabel && <Badge tone="grey">{result.variantLabel.toUpperCase()}</Badge>}
            <Badge tone="teal">{t('results.ratesEffective', { date: result.updatedDate })}</Badge>
          </View>

          <View style={styles.tabRow}>
            {TABS.map((tv) => (
              <PressableTab key={tv} active={tab === tv} label={t(`results.tab.${tv}`)} onPress={() => setTab(tv)} />
            ))}
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={{ gap: 14 }}>
            {tab === 'overview' && (
              <>
                <View style={styles.statsGrid}>
                  <Stat label={t('results.principal')} value={fmtLkr(result.maxLoan)} />
                  <Stat label={t('results.statTotalCost')} value={fmtLkr(result.totalCostOfCredit)} />
                  <Stat label={t('results.docCharge')} value={fmtLkr(result.docCharge)} />
                  <Stat label={t('results.statEmi')} value={fmtLkr(result.emi)} />
                  <Stat label={t('results.totalOutlay')} value={fmtLkr(result.totalOutlay)} />
                  {!!result.downPayment && <Stat label={t('results.downPayment')} value={fmtLkr(result.downPayment)} />}
                  {!!result.legalFee && <Stat label={t('results.legalFee')} value={fmtLkr(result.legalFee)} />}
                  {result.netCashInHand != null && (
                    <Stat
                      label={t('results.netCashInHand')}
                      value={fmtLkr(result.netCashInHand)}
                      hint={shortfall ? t('results.shortfallHint') : undefined}
                    />
                  )}
                </View>

                <View>
                  <Text style={styles.blockLabel}>{t('results.stressTestTitle')}</Text>
                  <View style={styles.statsGrid}>
                    <Stat label={`${result.rate}%`} value={fmtLkr(result.emi)} />
                    <Stat label={`${(result.rate ?? 0) + 1}%`} value={fmtLkr(result.emiPlus1)} />
                    <Stat label={`${(result.rate ?? 0) + 2}%`} value={fmtLkr(result.emiPlus2)} />
                  </View>
                </View>

                <View>
                  <Text style={styles.blockLabel}>{t('results.milestoneTitle')}</Text>
                  <View style={styles.milestoneRow}>
                    {[1, 3, 5].map((y) => (
                      <PressableTab key={y} active={milestone === y} label={`${y}yr`} onPress={() => setMilestone(y)} compact />
                    ))}
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <Stat label={t('results.milestoneLabel', { years: milestone })} value={fmtLkr(milestoneBalance)} />
                  </View>
                </View>

                <GhostButton title={t('results.sendWhatsapp')} onPress={shareWhatsapp} />

                <View style={styles.divider} />

                {status === 'sent' ? (
                  <Text style={styles.callbackSent}>{t('results.consultationSent')}</Text>
                ) : (
                  <>
                    <Text style={styles.modalLabel}>{t('results.requestConsultation')}</Text>
                    <FormField placeholder={t('common.namePlaceholder')} value={name} onChangeText={setName} />
                    <FormField placeholder={t('common.phonePlaceholder')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                    <PrimaryButton
                      title={t('results.requestConsultationBtn')}
                      onPress={submit}
                      disabled={!valid || status === 'sending'}
                      loading={status === 'sending'}
                    />
                    {status === 'error' && <Text style={styles.errorText}>{t('common.genericError')}</Text>}
                  </>
                )}
              </>
            )}

            {tab === 'amortization' && (
              <ScrollView horizontal contentContainerStyle={{ minWidth: '100%' }}>
                <View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableHeadCell, styles.colYear]}>{t('results.amortYear')}</Text>
                    <Text style={[styles.tableHeadCell, styles.colWide]}>{t('results.amortPayment')}</Text>
                    <Text style={[styles.tableHeadCell, styles.colWide]}>{t('results.amortInterest')}</Text>
                    <Text style={[styles.tableHeadCell, styles.colWide]}>{t('results.amortPrincipal')}</Text>
                    <Text style={[styles.tableHeadCell, styles.colWide]}>{t('results.amortBalance')}</Text>
                  </View>
                  {schedule.map((row) => (
                    <View key={row.year} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.colYear]}>{row.year}</Text>
                      <Text style={[styles.tableCell, styles.colWide]}>{fmtLkr(row.monthlyPayment)}</Text>
                      <Text style={[styles.tableCell, styles.colWide]}>{fmtLkr(row.interestPaid)}</Text>
                      <Text style={[styles.tableCell, styles.colWide]}>{fmtLkr(row.principalPaid)}</Text>
                      <Text style={[styles.tableCell, styles.colWide, { fontWeight: '700' }]}>{fmtLkr(row.remainingBalance)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            {tab === 'guarantor' && (
              <View style={{ gap: 8 }}>
                {result.remarks && result.remarks.length > 0 ? (
                  result.remarks.map((r, i) => (
                    <View key={i} style={styles.remarkRow}>
                      <Text style={styles.remarkText}>{r}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.remarkEmpty}>{t('results.noGuarantorConditions')}</Text>
                )}
                <Text style={styles.remarkDisclaimer}>{t('results.guarantorDisclaimer')}</Text>
              </View>
            )}
          </ScrollView>

          <GhostButton title={t('common.close')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function PressableTab({ active, label, onPress, compact }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, compact && styles.tabButtonCompact, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guestBanner: {
    backgroundColor: colors.teal50,
    borderWidth: 1,
    borderColor: colors.teal100,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  guestBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.teal900,
    textAlign: 'center',
  },
  guestBannerSub: {
    fontSize: 13,
    color: colors.text600,
    marginTop: 2,
  },
  termBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
  },
  callbackBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  callbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text900,
  },
  callbackSent: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal800,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.text600,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardBest: {
    borderColor: colors.teal700,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.teal100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: colors.teal800,
    fontWeight: '800',
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text900,
  },
  updatedText: {
    marginTop: 3,
    fontSize: 11,
    color: colors.text400,
  },
  ineligibleText: {
    backgroundColor: colors.danger100,
    color: colors.danger,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  stat: {
    width: '45%',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text400,
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text900,
  },
  statHint: {
    marginTop: 2,
    fontSize: 11,
    color: colors.danger,
  },
  capText: {
    fontSize: 11,
    color: colors.text400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 16,
    gap: 12,
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text900,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text900,
    marginTop: 4,
  },
  modalScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabButtonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabButtonActive: {
    borderColor: colors.teal700,
    backgroundColor: colors.teal700,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text600,
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text900,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tableHeadCell: {
    backgroundColor: colors.teal50,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text600,
    textTransform: 'uppercase',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 12,
    color: colors.text900,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colYear: {
    width: 50,
    textAlign: 'center',
  },
  colWide: {
    width: 100,
    textAlign: 'right',
  },
  remarkRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
  },
  remarkText: {
    fontSize: 13,
    color: colors.text900,
  },
  remarkEmpty: {
    fontSize: 13,
    color: colors.text600,
  },
  remarkDisclaimer: {
    fontSize: 11,
    color: colors.text400,
    marginTop: 4,
  },
});
