import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const TONES = {
  teal: { bg: colors.teal100, fg: colors.teal800 },
  grey: { bg: colors.grey100, fg: colors.text600 },
  danger: { bg: colors.danger100, fg: colors.danger },
};

export function Badge({ tone = 'grey', children }) {
  const t = TONES[tone] || TONES.grey;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
