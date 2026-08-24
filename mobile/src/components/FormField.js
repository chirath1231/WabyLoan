import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function FormField({ label, hint, error, style, ...inputProps }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.text400}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text900,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text900,
    backgroundColor: colors.card,
  },
  inputError: {
    borderColor: colors.danger,
  },
  hint: {
    fontSize: 12,
    color: colors.text400,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
});
