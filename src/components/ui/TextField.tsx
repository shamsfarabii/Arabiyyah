import { useState, type ReactNode, type Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SPACING,
} from '@/constants/theme';
import { commonStyles } from '@/styles/commonStyles';

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
  required?: boolean;
  hint?: string;
  showCounter?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  labelAccessory?: ReactNode;
  ref?: Ref<TextInput>;
};

export function TextField({
  label,
  errorMessage,
  required = false,
  hint,
  showCounter = false,
  containerStyle,
  labelAccessory,
  style,
  onFocus,
  onBlur,
  value,
  maxLength,
  ref,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(errorMessage);
  const canCount =
    showCounter && typeof maxLength === 'number' && (value ?? '').length > 0;

  const handleFocus: FocusHandler = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: BlurHandler = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={[commonStyles.row, commonStyles.alignCenter, styles.labelRow]}>
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </Text>
        <View style={commonStyles.grow} />
        {labelAccessory}
        {canCount ? (
          <Text style={styles.counter}>
            {(value ?? '').length}/{maxLength}
          </Text>
        ) : null}
      </View>

      <TextInput
        ref={ref}
        value={value}
        maxLength={maxLength}
        placeholderTextColor={COLORS.textMutedSecondary}
        selectionColor={COLORS.primary}
        accessibilityLabel={label}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          style,
        ]}
        {...inputProps}
      />

      {hasError ? (
        <View
          style={[commonStyles.row, commonStyles.alignCenter, styles.message]}
          accessibilityLiveRegion="polite"
        >
          <AppIcon name="warning" size={ICON_SIZES.sm - 2} color={COLORS.danger} />
          <Text style={styles.error}>{errorMessage}</Text>
        </View>
      ) : null}

      {!hasError && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    marginBottom: SPACING.sm - 2,
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  requiredMark: {
    color: COLORS.danger,
    fontWeight: FONT_WEIGHTS.bold,
  },
  counter: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMutedSecondary,
    fontVariant: ['tabular-nums'],
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
    backgroundColor: COLORS.surfaceInput,
  },
  inputFocused: {
    borderColor: COLORS.inputFocusBorder,
    backgroundColor: COLORS.card,
  },
  inputError: {
    borderColor: COLORS.borderDanger,
    backgroundColor: COLORS.surfaceDanger,
  },
  message: {
    marginTop: SPACING.xs + 2,
    gap: SPACING.xs + 2,
  },
  error: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.danger,
  },
  hint: {
    marginTop: SPACING.xs + 2,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    color: COLORS.textMutedSecondary,
  },
});
