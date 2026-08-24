import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export function ChoiceCard({ title, subtitle, selected, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed, style]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.card,
  },
  pressed: {
    backgroundColor: colors.grey100,
  },
  selected: {
    borderColor: colors.teal700,
    backgroundColor: colors.teal50,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.teal700,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.teal700,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text900,
  },
  titleSelected: {
    color: colors.teal900,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.text600,
  },
});
