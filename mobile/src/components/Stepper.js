import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

/** Big-target +/- control used instead of a slider so precise entry is easy on any phone. */
export function Stepper({ label, value, min, max, step = 1, unit = '', onChange, hint }) {
  function clamp(v) {
    return Math.min(max, Math.max(min, v));
  }

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>
          {label}: <Text style={styles.value}>{value}{unit}</Text>
        </Text>
      ) : null}
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(clamp(value - step))}
          disabled={value <= min}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, value <= min && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <View style={styles.display}>
          <Text style={styles.displayText}>{value}{unit}</Text>
        </View>
        <Pressable
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, value >= max && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text900,
  },
  value: {
    color: colors.teal800,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.teal50,
    borderWidth: 1.5,
    borderColor: colors.teal700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    backgroundColor: colors.teal100,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.teal800,
    lineHeight: 24,
  },
  display: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  displayText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text900,
  },
  hint: {
    fontSize: 12,
    color: colors.text400,
  },
});
