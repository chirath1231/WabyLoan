import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function GhostButton({ title, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, disabled && styles.textDisabled]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: {
    backgroundColor: colors.grey100,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.teal800,
    fontSize: 16,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.text400,
  },
});
