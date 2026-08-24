import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Common page shell: safe-area + scroll + keyboard avoidance, with footer content pinned to the bottom. */
export function ScreenContainer({ children, footer, scroll = true }) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.scrollContent}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LanguageSwitcher style={styles.langBar} />
        {content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 20,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: colors.background,
  },
  langBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});
