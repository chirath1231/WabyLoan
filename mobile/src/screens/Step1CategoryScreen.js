import React from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { StepHeader } from '../components/StepHeader';
import { ChoiceCard } from '../components/ChoiceCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { useWizard } from '../context/WizardContext';
import { useLanguage } from '../context/LanguageContext';

const CATEGORY_VALUES = ['personal', 'professional', 'housing', 'vehicle', 'business'];

export function Step1CategoryScreen({ navigation }) {
  const { state, setField } = useWizard();
  const { t } = useLanguage();

  return (
    <ScreenContainer
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <GhostButton title={t('common.back')} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={t('common.continue')}
              disabled={!state.loanCategory}
              onPress={() => navigation.navigate('Step2Profile')}
            />
          </View>
        </View>
      }
    >
      <StepHeader step={1} title={t('step1.title')} subtitle={t('step1.subtitle')} />
      <View style={{ gap: 12 }}>
        {CATEGORY_VALUES.map((v) => (
          <ChoiceCard
            key={v}
            title={t(`categories.${v}.label`)}
            subtitle={t(`categories.${v}.subtitle`)}
            selected={state.loanCategory === v}
            onPress={() => setField('loanCategory', v)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}
