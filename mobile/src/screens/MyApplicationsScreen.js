import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostButton } from '../components/GhostButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { colors } from '../theme/colors';
import { api, ApiError } from '../api/client';
import { fmtLkr } from '../lib/format';
import { useLanguage } from '../context/LanguageContext';

const CATEGORY_VALUES = ['personal', 'professional', 'housing', 'vehicle', 'business'];

export function MyApplicationsScreen({ navigation }) {
  const { t } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/applications/me')
      .then(setApplications)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('myApps.loadError')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myApps.title')}</Text>
        <GhostButton title={t('common.close')} onPress={() => navigation.goBack()} />
      </View>
      <LanguageSwitcher style={styles.langBar} />

      {loading && <ActivityIndicator style={{ marginTop: 32 }} color={colors.teal700} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && applications.length === 0 && <Text style={styles.empty}>{t('myApps.empty')}</Text>}

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const topResult = item.resultsSnapshot?.results?.find((r) => !r.ineligible);
          const categoryLabel = CATEGORY_VALUES.includes(item.loanCategory)
            ? t(`categories.${item.loanCategory}.label`)
            : item.loanCategory;
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{categoryLabel}</Text>
              <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              {topResult ? (
                <Text style={styles.cardResult}>
                  {t('myApps.bestOffer', { bank: topResult.bankName, amount: fmtLkr(topResult.maxLoan), rate: topResult.rate })}
                </Text>
              ) : (
                <Text style={styles.cardResult}>{t('myApps.noEligible')}</Text>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text900,
  },
  langBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  error: {
    color: colors.danger,
    fontWeight: '600',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  empty: {
    color: colors.text600,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text900,
  },
  cardDate: {
    fontSize: 12,
    color: colors.text400,
  },
  cardResult: {
    marginTop: 4,
    fontSize: 14,
    color: colors.text600,
  },
});
