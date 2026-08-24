import React from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { StepHeader } from '../components/StepHeader';
import { MoneyField } from '../components/MoneyField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { useWizard } from '../context/WizardContext';
import { useLanguage } from '../context/LanguageContext';

export function Step3IncomeScreen({ navigation }) {
  const { state, setField } = useWizard();
  const { t } = useLanguage();
  const isBusiness = state.loanCategory === 'business';
  const isSelfEmployed = state.sector === 'self_employed';

  const canContinue = isBusiness
    ? state.businessRevenue > 0
    : state.grossMonthlyIncome > 0;

  return (
    <ScreenContainer
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <GhostButton title={t('common.back')} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton title={t('common.continue')} disabled={!canContinue} onPress={() => navigation.navigate('Step4Details')} />
          </View>
        </View>
      }
    >
      <StepHeader step={3} title={t('step3.title')} subtitle={t('step3.subtitle')} />

      {isBusiness ? (
        <>
          <MoneyField
            label={t('step3.businessRevenue')}
            value={state.businessRevenue}
            onChangeValue={(v) => setField('businessRevenue', v)}
          />
          <MoneyField
            label={t('step3.businessExpenses')}
            value={state.businessExpenses}
            onChangeValue={(v) => setField('businessExpenses', v)}
          />
        </>
      ) : isSelfEmployed ? (
        <MoneyField
          label={t('step3.selfEmployedIncome')}
          hint={t('step3.selfEmployedIncomeHint')}
          value={state.grossMonthlyIncome}
          onChangeValue={(v) => setField('grossMonthlyIncome', v)}
        />
      ) : (
        <>
          <MoneyField
            label={t('step3.grossIncome')}
            hint={t('step3.grossIncomeHint')}
            value={state.grossMonthlyIncome}
            onChangeValue={(v) => setField('grossMonthlyIncome', v)}
          />
          <MoneyField
            label={t('step3.deductions')}
            hint={t('step3.deductionsHint')}
            value={state.deductionsTotal}
            onChangeValue={(v) => setField('deductionsTotal', v)}
          />
        </>
      )}
    </ScreenContainer>
  );
}
