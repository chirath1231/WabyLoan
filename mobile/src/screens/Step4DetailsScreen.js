import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { StepHeader } from '../components/StepHeader';
import { MoneyField } from '../components/MoneyField';
import { FormField } from '../components/FormField';
import { Stepper } from '../components/Stepper';
import { ToggleRow } from '../components/ToggleRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { colors } from '../theme/colors';
import { useWizard } from '../context/WizardContext';
import { useLanguage } from '../context/LanguageContext';
import { fmtLkr } from '../lib/format';
import { buildContextLabel } from '../lib/context';

export function Step4DetailsScreen({ navigation }) {
  const { state, setField } = useWizard();
  const { t } = useLanguage();
  const category = state.loanCategory;

  const vehicleTooOld = category === 'vehicle' && new Date().getFullYear() - state.vehicleYear > 15;
  const legalFee = category === 'housing' ? Math.min(state.housingPropertyValue * 0.003, 100000) : 0;

  const canContinue = !vehicleTooOld;

  return (
    <ScreenContainer
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <GhostButton title={t('common.back')} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton title={t('step4.submit')} disabled={!canContinue} onPress={() => navigation.navigate('Results')} />
          </View>
        </View>
      }
    >
      <StepHeader step={4} title={t('step4.title')} subtitle={t('step4.subtitle')} context={buildContextLabel(state, t)} />

      {category === 'vehicle' && (
        <View style={{ gap: 16 }}>
          <MoneyField label={t('step4.vehicleValuation')} value={state.vehicleValuation} onChangeValue={(v) => setField('vehicleValuation', v)} />
          <FormField
            label={t('step4.manufacturingYear')}
            keyboardType="number-pad"
            value={String(state.vehicleYear)}
            onChangeText={(txt) => setField('vehicleYear', Number(txt) || 0)}
            error={vehicleTooOld ? t('step4.vehicleTooOld') : null}
          />
          <Stepper label={t('step4.downPayment')} value={state.vehicleDownPaymentPct} min={10} max={50} step={5} unit="%" onChange={(v) => setField('vehicleDownPaymentPct', v)} />
          <ToggleRow title={t('step4.balloonPayment')} value={state.vehicleBalloon} onValueChange={(v) => setField('vehicleBalloon', v)} />
          <Stepper
            label={t('step4.targetTerm')}
            value={state.requestedTermYears}
            min={1}
            max={7}
            unit=" yrs"
            onChange={(v) => setField('requestedTermYears', v)}
            hint={t('step4.tenureHint')}
          />
        </View>
      )}

      {category === 'housing' && (
        <View style={{ gap: 16 }}>
          <MoneyField label={t('step4.propertyValue')} value={state.housingPropertyValue} onChangeValue={(v) => setField('housingPropertyValue', v)} />
          <Stepper
            label={t('step4.repaymentDuration')}
            value={state.housingTerm}
            min={5}
            max={30}
            unit=" yrs"
            onChange={(v) => setField('housingTerm', v)}
            hint={t('step4.tenureHint')}
          />
          <Stepper label={t('step4.downPayment')} value={state.housingDownPaymentPct} min={10} max={50} step={5} unit="%" onChange={(v) => setField('housingDownPaymentPct', v)} />
          <Text style={styles.hint}>{t('step4.legalFeeHint', { fee: fmtLkr(legalFee) })}</Text>
        </View>
      )}

      {category === 'business' && (
        <Stepper
          label={t('step4.targetTerm')}
          value={state.businessTermYears}
          min={1}
          max={7}
          unit=" yrs"
          onChange={(v) => setField('businessTermYears', v)}
          hint={t('step4.tenureHint')}
        />
      )}

      {(category === 'personal' || category === 'professional') && (
        <Stepper
          label={t('step4.targetTerm')}
          value={state.requestedTermYears}
          min={1}
          max={8}
          unit=" yrs"
          onChange={(v) => setField('requestedTermYears', v)}
          hint={t('step4.tenureHint')}
        />
      )}

      <View style={styles.section}>
        <MoneyField
          label={t('step4.existingObligations')}
          value={state.existingObligations}
          onChangeValue={(v) => {
            setField('existingObligations', v);
            if (v <= 0) {
              setField('settleWithNewLoan', false);
              setField('outstandingBalanceToSettle', 0);
            }
          }}
        />
        {state.existingObligations > 0 && (
          <>
            <ToggleRow
              title={t('step4.settleToggle')}
              value={state.settleWithNewLoan}
              onValueChange={(v) => setField('settleWithNewLoan', v)}
            />
            {state.settleWithNewLoan && (
              <MoneyField
                label={t('step4.outstandingBalance')}
                value={state.outstandingBalanceToSettle}
                onChangeValue={(v) => setField('outstandingBalanceToSettle', v)}
              />
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 12,
    color: colors.text400,
  },
  section: {
    gap: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
  },
});
