import React from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

/** Full-screen list picker — easier to tap correctly than a compact dropdown. */
export function PickerField({ label, placeholder, value, options, onSelect }) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.triggerText : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{label || placeholder}</Text>
          <Pressable onPress={() => setOpen(false)} hitSlop={12}>
            <Text style={styles.closeText}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed, item.value === value && styles.optionSelected]}
              onPress={() => {
                onSelect(item.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </Modal>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.card,
  },
  triggerText: {
    fontSize: 16,
    color: colors.text900,
  },
  placeholder: {
    fontSize: 16,
    color: colors.text400,
  },
  chevron: {
    fontSize: 20,
    color: colors.text400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text900,
  },
  closeText: {
    fontSize: 16,
    color: colors.teal700,
    fontWeight: '700',
  },
  list: {
    padding: 12,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionPressed: {
    backgroundColor: colors.grey100,
  },
  optionSelected: {
    backgroundColor: colors.teal50,
  },
  optionText: {
    fontSize: 16,
    color: colors.text900,
  },
  optionTextSelected: {
    color: colors.teal800,
    fontWeight: '700',
  },
});
