import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { StepHeader } from '../components/StepHeader';
import { ChoiceCard } from '../components/ChoiceCard';
import { FormField } from '../components/FormField';
import { MoneyField } from '../components/MoneyField';
import { ToggleRow } from '../components/ToggleRow';
import { PickerField } from '../components/PickerModal';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { colors } from '../theme/colors';
import { useWizard, DEFAULT_RETIREMENT } from '../context/WizardContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import { buildContextLabel } from '../lib/context';

const SECTOR_VALUES = ['government', 'semi_government', 'private', 'self_employed'];

export function Step2ProfileScreen({ navigation }) {
  const { state, setField, setFields } = useWizard();
  const { t } = useLanguage();
  const [occupations, setOccupations] = useState([]);
  const [ageText, setAgeText] = useState(state.age ? String(state.age) : '');
  const [retirementText, setRetirementText] = useState(state.retirementAge ? String(state.retirementAge) : '');

  useEffect(() => {
    api
      .get('/occupations')
      .then((data) => setOccupations(data || []))
      .catch(() => setOccupations([]));
  }, []);

  function selectSector(sector) {
    const patch = { sector };
    if (!state.retirementAgeCustom) {
      patch.retirementAge = DEFAULT_RETIREMENT[sector];
      setRetirementText(String(DEFAULT_RETIREMENT[sector]));
    }
    setFields(patch);
  }

  const ageValid = state.age !== null && state.age >= 18 && state.age <= 70;
  const retirementValid = state.retirementAge !== null && state.retirementAge >= 18 && state.retirementAge <= 75;
  const bothValid = ageValid && retirementValid;
  const maxTenure = bothValid ? state.retirementAge - state.age : null;
  const retirementReached = maxTenure !== null && maxTenure <= 0;
  const nearRetirement = maxTenure !== null && maxTenure > 0 && maxTenure <= 5;

  const canContinue = Boolean(state.sector) && Boolean(state.occupationId) && ageValid && retirementValid && !retirementReached;

  return (
    <ScreenContainer
      footer={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <GhostButton title={t('common.back')} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton title={t('common.continue')} disabled={!canContinue} onPress={() => navigation.navigate('Step3Income')} />
          </View>
        </View>
      }
    >
      <StepHeader step={2} title={t('step2.title')} subtitle={t('step2.subtitle')} context={buildContextLabel(state, t)} />

      <View style={{ gap: 12 }}>
        <Text style={styles.label}>{t('step2.sectorLabel')}</Text>
        {SECTOR_VALUES.map((v) => (
          <ChoiceCard key={v} title={t(`sectors.${v}`)} selected={state.sector === v} onPress={() => selectSector(v)} />
        ))}
      </View>

      <PickerField
        label={t('step2.occupationLabel')}
        placeholder={t('step2.occupationPlaceholder')}
        value={state.occupationId}
        options={occupations.map((o) => ({ value: o.id, label: o.label }))}
        onSelect={(v) => setField('occupationId', v)}
      />

      <FormField
        label={t('step2.ageLabel')}
        placeholder={t('step2.agePlaceholder')}
        keyboardType="number-pad"
        value={ageText}
        onChangeText={(txt) => {
          setAgeText(txt);
          setField('age', txt === '' ? null : Number(txt));
        }}
        error={state.age !== null && !ageValid ? t('step2.ageError') : null}
      />

      <FormField
        label={t('step2.retirementLabel')}
        placeholder={t('step2.retirementPlaceholder')}
        keyboardType="number-pad"
        value={retirementText}
        onChangeText={(txt) => {
          setRetirementText(txt);
          setFields({ retirementAgeCustom: true, retirementAge: txt === '' ? null : Number(txt) });
        }}
      />

      <View style={styles.infoBox}>
        {!bothValid && <Text style={styles.infoText}>{t('step2.infoPrompt')}</Text>}
        {bothValid && retirementReached && <Text style={styles.infoDanger}>{t('step2.retirementReached')}</Text>}
        {bothValid && !retirementReached && (
          <View>
            <Text style={styles.infoText}>{t('step2.maxTenure', { years: maxTenure })}</Text>
            {nearRetirement && <Text style={styles.infoWarn}>{t('step2.nearRetirement', { years: maxTenure })}</Text>}
          </View>
        )}
      </View>

      <ToggleRow
        title={t('step2.jointApplicant')}
        subtitle={t('step2.jointApplicantSubtitle')}
        value={state.jointApplicant}
        onValueChange={(v) => setField('jointApplicant', v)}
      />
      {state.jointApplicant && (
        <MoneyField
          label={t('step2.coApplicantIncome')}
          value={state.coApplicantIncome}
          onChangeValue={(v) => setField('coApplicantIncome', v)}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text900,
  },
  infoBox: {
    backgroundColor: colors.teal50,
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    fontSize: 14,
    color: colors.text600,
  },
  infoDanger: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  infoWarn: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.amber700,
  },
});
