import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSwitcher({ style }) {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <View style={[styles.row, style]}>
      {languages.map((l) => {
        const active = l.code === language;
        return (
          <Pressable
            key={l.code}
            onPress={() => setLanguage(l.code)}
            style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && !active && styles.pillPressed]}
            hitSlop={6}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{l.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  pillPressed: {
    backgroundColor: colors.grey100,
  },
  pillActive: {
    backgroundColor: colors.teal700,
    borderColor: colors.teal700,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text600,
  },
  pillTextActive: {
    color: colors.white,
  },
});
