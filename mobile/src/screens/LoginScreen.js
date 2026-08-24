import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigation.goBack();
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: 12 }}>
          <PrimaryButton title={t('common.logIn')} onPress={submit} disabled={!canSubmit} loading={loading} />
          <GhostButton title={t('login.noAccount')} onPress={() => navigation.replace('Register')} />
        </View>
      }
    >
      <Text style={styles.title}>{t('login.title')}</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

      <FormField
        label={t('common.email')}
        placeholder={t('common.emailPlaceholder')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label={t('common.password')}
        placeholder={t('common.passwordPlaceholder')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text600,
    marginTop: -12,
  },
  error: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
});
