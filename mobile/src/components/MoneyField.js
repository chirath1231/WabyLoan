import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { parseMoney } from '../lib/format';

/** Numeric-keypad money entry. Reports plain numbers via onChangeValue; shows LKR prefix. */
export function MoneyField({ label, hint, value, onChangeValue }) {
  const [text, setText] = useState(value ? String(value) : '');

  function handleChange(t) {
    setText(t);
    onChangeValue(parseMoney(t));
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.prefix}>LKR</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.text400}
          value={text}
          onChangeText={handleChange}
          onBlur={() => setText(value ? String(value) : '')}
        />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text400,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text900,
  },
  hint: {
    fontSize: 12,
    color: colors.text400,
  },
});
