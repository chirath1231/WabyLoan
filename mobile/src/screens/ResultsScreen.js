import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { StepHeader } from '../components/StepHeader';
import { Stepper } from '../components/Stepper';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { FormField } from '../components/FormField';
import { colors } from '../theme/colors';
import { useWizard, buildEligibilityInput } from '../context/WizardContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, ApiError } from '../api/client';
import { fmtLkr } from '../lib/format';

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
  const { isSignedIn } = useAuth();
  const { t } = useLanguage();
  const [term, setTerm] = useState(state.requestedTermYears);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leadTarget, setLeadTarget] = useState(null);
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
      <StepHeader step={5} title={t('results.title')} />

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

      <View style={{ gap: 12 }}>
        {eligible.map((r, i) => (
          <BankCard
            key={r.variantKey}
            result={r}
            rank={i + 1}
            restricted={state.restricted}
            onRequestInfo={() => setLeadTarget(r)}
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

      <LeadModal
        visible={Boolean(leadTarget)}
        result={leadTarget}
        loanCategory={state.loanCategory}
        applicationId={state.applicationId}
        onClose={() => setLeadTarget(null)}
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

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function LeadModal({ visible, result, loanCategory, applicationId, onClose }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (visible) {
      setName('');
      setPhone('');
      setStatus('idle');
    }
  }, [visible]);

  if (!result) return null;
  const valid = name.trim().length > 0 && PHONE_RE.test(phone);

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

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{result.bankName}</Text>
          <View style={styles.statsGrid}>
            <Stat label={t('results.statMaxLoan')} value={fmtLkr(result.maxLoan)} />
            <Stat label={t('results.statInterestRate')} value={`${result.rate}%`} />
            <Stat label={t('results.statEmi')} value={fmtLkr(result.emi)} />
            <Stat label={t('results.statTotalCost')} value={fmtLkr(result.totalCostOfCredit)} />
          </View>

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
          <GhostButton title={t('common.close')} onPress={onClose} />
        </View>
      </View>
    </Modal>
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
    gap: 12,
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
});
