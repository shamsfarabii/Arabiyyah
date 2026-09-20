import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
  required?: boolean;
};

export function TextField({
  label,
  errorMessage,
  required = false,
  style,
  ...inputProps
}: TextFieldProps) {
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, hasError && styles.inputError, style]}
        {...inputProps}
      />
      {hasError ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    marginBottom: SPACING.xs,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  inputError: {
    borderColor: COLORS.primary,
  },
  error: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
});
