import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const STEP_COUNT = 5;

export function StepHeader({ step, title, subtitle }) {
  return (
    <View style={styles.wrap}>
      {step ? (
        <View style={styles.dots}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
          ))}
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  dotActive: {
    backgroundColor: colors.teal700,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text600,
    lineHeight: 20,
  },
});
