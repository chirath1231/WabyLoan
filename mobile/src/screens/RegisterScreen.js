import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, name.trim() || undefined);
      navigation.goBack();
    } catch (err) {
      setError(err.message || t('register.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer
      footer={
        <View style={{ gap: 12 }}>
          <PrimaryButton title={t('register.submit')} onPress={submit} disabled={!canSubmit} loading={loading} />
          <GhostButton title={t('register.haveAccount')} onPress={() => navigation.replace('Login')} />
        </View>
      }
    >
      <Text style={styles.title}>{t('register.title')}</Text>

      <FormField label={t('register.nameLabel')} placeholder={t('common.namePlaceholder')} value={name} onChangeText={setName} />
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
        placeholder={t('register.passwordPlaceholder')}
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
  error: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 13,
  },
});
