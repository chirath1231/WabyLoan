import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function ToggleRow({ title, subtitle, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.teal100 }}
        thumbColor={value ? colors.teal700 : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.card,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text900,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.text600,
  },
});
