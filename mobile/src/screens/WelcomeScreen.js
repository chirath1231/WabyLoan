import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useWizard } from '../context/WizardContext';
import { useLanguage } from '../context/LanguageContext';

export function WelcomeScreen({ navigation }) {
  const { isSignedIn, user, logout } = useAuth();
  const { reset } = useWizard();
  const { t } = useLanguage();

  function startCheck() {
    reset();
    navigation.navigate('Step1Category');
  }

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: 12 }}>
          <PrimaryButton title={t('welcome.checkEligibility')} onPress={startCheck} />
          {isSignedIn ? (
            <GhostButton title={t('common.signOut')} onPress={logout} />
          ) : (
            <GhostButton title={t('common.signIn')} onPress={() => navigation.navigate('Login')} />
          )}
        </View>
      }
    >
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>WL</Text>
        </View>
        <Text style={styles.brand}>WabyLoan</Text>
        <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
      </View>

      {isSignedIn && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {user?.name ? t('welcome.welcomeBackNamed', { name: user.name }) : t('welcome.welcomeBackPlain')}
          </Text>
          <GhostButton title={t('common.viewApplications')} onPress={() => navigation.navigate('MyApplications')} />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('welcome.howItWorks')}</Text>
        <Step number="1" text={t('welcome.step1')} />
        <Step number="2" text={t('welcome.step2')} />
        <Step number="3" text={t('welcome.step3')} />
      </View>

      <Text style={styles.disclaimer}>{t('welcome.disclaimer')}</Text>
    </ScreenContainer>
  );
}

function Step({ number, text }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    gap: 6,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.teal700,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text900,
  },
  tagline: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.text600,
    marginTop: 4,
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text900,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.teal100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.teal800,
    fontWeight: '800',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text600,
    paddingTop: 3,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.text400,
    textAlign: 'center',
    lineHeight: 17,
  },
});
