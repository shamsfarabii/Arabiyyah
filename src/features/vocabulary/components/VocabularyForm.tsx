import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type SubmitErrorHandler,
  type SubmitHandler,
} from 'react-hook-form';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { FormSection } from '@/components/ui/FormSection';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SIZES,
  SPACING,
} from '@/constants/theme';
import {
  MAX_VOCABULARY_DESCRIPTION_LENGTH,
  MAX_VOCABULARY_EXAMPLE_LENGTH,
  MAX_VOCABULARY_EXAMPLES,
  MAX_VOCABULARY_MEANING_LENGTH,
  MAX_VOCABULARY_WORD_LENGTH,
} from '@/features/vocabulary/constants';
import {
  vocabularySchema,
  type VocabularyFormValues,
  type VocabularyValidatedInput,
} from '@/features/vocabulary/schemas/vocabularySchema';
import { createShadow } from '@/helpers/styleHelpers';
import { appAlert } from '@/utils/appAlert';
import { commonStyles } from '@/styles/commonStyles';

type VocabularyFormProps = {
  initialValues?: Partial<VocabularyFormValues>;
  submitLabel: string;
  onSubmit: (values: VocabularyValidatedInput) => Promise<void>;
  onDelete?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

const emptyDefaults: VocabularyFormValues = {
  arabicWord: '',
  meaning: '',
  examples: [],
  description: '',
  imageUri: '',
};

const formCardShadow = createShadow(2, COLORS.accent, 0.05, 3);

function countFieldErrors(node: unknown): number {
  if (!node || typeof node !== 'object') {
    return 0;
  }

  if (typeof (node as { message?: unknown }).message === 'string') {
    return 1;
  }

  return Object.values(node as Record<string, unknown>).reduce<number>(
    (total, child) => total + countFieldErrors(child),
    0,
  );
}

export function VocabularyForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
  onDirtyChange,
}: VocabularyFormProps) {
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty, submitCount },
  } = useForm<VocabularyFormValues, unknown, VocabularyValidatedInput>({
    resolver: zodResolver(vocabularySchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    defaultValues: {
      ...emptyDefaults,
      ...initialValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'examples',
  });

  const arabicWordRef = useRef<TextInput>(null);
  const meaningRef = useRef<TextInput>(null);

  const imageUri = useWatch({ control, name: 'imageUri' });
  const arabicWordPreview = useWatch({ control, name: 'arabicWord' })?.trim() ?? '';
  const meaningPreview = useWatch({ control, name: 'meaning' })?.trim() ?? '';

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const errorCount = countFieldErrors(errors);
  const showErrorSummary = submitCount > 0 && errorCount > 0;
  const canAddExample = fields.length < MAX_VOCABULARY_EXAMPLES;

  const handleChooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      appAlert(
        'Photo access needed',
        'Allow access to your photos so you can attach a picture to this word.',
        permission.canAskAgain
          ? [{ text: 'OK' }]
          : [
              { text: 'Not now', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ],
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        setValue('imageUri', result.assets[0].uri, { shouldDirty: true });
      }
    } catch {
      appAlert('Could not open photos', 'Please try picking the image again.');
    }
  };

  const handleRemoveImage = () => {
    setValue('imageUri', '', { shouldDirty: true });
  };

  const handleRemoveExample = (index: number) => {
    const example = getValues(`examples.${index}`);
    const isEmpty =
      !example?.sentence?.trim() && !example?.meaning?.trim();

    if (isEmpty) {
      remove(index);
      return;
    }

    appAlert('Remove example?', 'This example will be cleared from the word.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(index) },
    ]);
  };

  const submitValues = useCallback<SubmitHandler<VocabularyValidatedInput>>(
    async (values) => {
      try {
        await onSubmit(values);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not save vocabulary.';
        appAlert('Save failed', message);
      }
    },
    [onSubmit],
  );

  const focusFirstInvalidField = useCallback<
    SubmitErrorHandler<VocabularyFormValues>
  >((formErrors) => {
    if (formErrors.arabicWord) {
      arabicWordRef.current?.focus();
      return;
    }
    if (formErrors.meaning) {
      meaningRef.current?.focus();
    }
  }, []);

  return (
    <View style={styles.form}>
      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Preview</Text>
        <Text
          style={[styles.previewArabic, !arabicWordPreview && styles.previewPlaceholder]}
          numberOfLines={2}
        >
          {arabicWordPreview || 'كَلِمَة جَدِيدَة'}
        </Text>
        <Text
          style={[styles.previewMeaning, !meaningPreview && styles.previewPlaceholder]}
          numberOfLines={2}
        >
          {meaningPreview || 'Its meaning shows up here'}
        </Text>
      </View>

      {showErrorSummary ? (
        <View
          style={[commonStyles.row, styles.errorSummary]}
          accessibilityLiveRegion="polite"
        >
          <AppIcon name="warning" size={ICON_SIZES.md} color={COLORS.danger} />
          <View style={commonStyles.grow}>
            <Text style={styles.errorSummaryTitle}>Almost there</Text>
            <Text style={styles.errorSummaryBody}>
              {errorCount === 1
                ? 'One field still needs your attention.'
                : `${errorCount} fields still need your attention.`}
            </Text>
          </View>
        </View>
      ) : null}

      <FormSection title="The word" badge="Required" badgeTone="required">
        <View style={styles.sectionCard}>
          <Controller
            control={control}
            name="arabicWord"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                ref={arabicWordRef}
                label="Arabic word"
                required
                hint="Write it exactly the way you want to review it."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.arabicWord?.message}
                placeholder="كِتَاب"
                autoCorrect={false}
                autoCapitalize="none"
                maxLength={MAX_VOCABULARY_WORD_LENGTH}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => meaningRef.current?.focus()}
                textAlign="right"
                style={styles.arabicInput}
              />
            )}
          />

          <Controller
            control={control}
            name="meaning"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                ref={meaningRef}
                label="Meaning"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.meaning?.message}
                placeholder="e.g. book"
                autoCorrect={false}
                maxLength={MAX_VOCABULARY_MEANING_LENGTH}
                returnKeyType="done"
              />
            )}
          />
        </View>
      </FormSection>

      <FormSection
        title="Examples"
        badge={
          fields.length === 0
            ? 'Optional'
            : `${fields.length} of ${MAX_VOCABULARY_EXAMPLES}`
        }
        hint="Sentences you have seen the word in make it much easier to recall."
      >
        {fields.map((field, index) => (
          <View key={field.id} style={styles.sectionCard}>
            <View style={[commonStyles.row, commonStyles.alignCenter, styles.exampleHeader]}>
              <View style={[commonStyles.centered, styles.exampleBadge]}>
                <Text style={styles.exampleBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.exampleTitle}>Example</Text>
              <View style={commonStyles.grow} />
              <IconButton
                icon="trash"
                tone="danger"
                onPress={() => handleRemoveExample(index)}
                accessibilityLabel={`Remove example ${index + 1}`}
              />
            </View>

            <Controller
              control={control}
              name={`examples.${index}.sentence`}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Sentence"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.examples?.[index]?.sentence?.message}
                  placeholder="أَقْرَأُ الكِتَابَ"
                  multiline
                  maxLength={MAX_VOCABULARY_EXAMPLE_LENGTH}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                  style={[styles.multilineInput, styles.arabicMultilineInput]}
                />
              )}
            />

            <Controller
              control={control}
              name={`examples.${index}.meaning`}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="What it means"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.examples?.[index]?.meaning?.message}
                  placeholder="I am reading the book"
                  multiline
                  maxLength={MAX_VOCABULARY_EXAMPLE_LENGTH}
                  style={styles.multilineInput}
                />
              )}
            />
          </View>
        ))}

        {canAddExample ? (
          <Pressable
            onPress={() => append({ sentence: '', meaning: '' })}
            accessibilityRole="button"
            accessibilityLabel="Add example"
            style={({ pressed }) => [
              commonStyles.row,
              commonStyles.centered,
              styles.addExample,
              pressed && styles.addExamplePressed,
            ]}
          >
            <AppIcon
              name="plus"
              size={ICON_SIZES.md}
              color={COLORS.primary}
              weight="semibold"
            />
            <Text style={styles.addExampleLabel}>
              {fields.length === 0 ? 'Add an example' : 'Add another example'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.maxExamplesNote}>
            That is the maximum of {MAX_VOCABULARY_EXAMPLES} examples.
          </Text>
        )}
      </FormSection>

      <FormSection
        title="Notes"
        badge="Optional"
        hint="Roots, grammar tips, or anything that helps the word stick."
      >
        <View style={styles.sectionCard}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Your notes"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="From the root ك-ت-ب, the same family as كَاتِب (writer)."
                multiline
                showCounter
                maxLength={MAX_VOCABULARY_DESCRIPTION_LENGTH}
                style={styles.multilineInput}
              />
            )}
          />
        </View>
      </FormSection>

      <FormSection title="Image" badge="Optional" hint="A picture makes recall faster.">
        {imageUri ? (
          <View style={styles.imageCard}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              contentFit="cover"
              accessibilityLabel="Selected vocabulary image"
            />
            <IconButton
              icon="xmark"
              tone="overlay"
              onPress={handleRemoveImage}
              accessibilityLabel="Remove image"
              style={styles.removeImageButton}
            />
            <Pressable
              onPress={() => void handleChooseImage()}
              accessibilityRole="button"
              accessibilityLabel="Change image"
              style={({ pressed }) => [
                commonStyles.centered,
                styles.changePhotoBadge,
                pressed && styles.changePhotoBadgePressed,
              ]}
            >
              <Text style={styles.changePhotoText}>Change photo</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => void handleChooseImage()}
            accessibilityRole="button"
            accessibilityLabel="Add vocabulary image"
            style={({ pressed }) => [
              styles.imagePicker,
              pressed && styles.imagePickerPressed,
            ]}
          >
            <View style={[commonStyles.centered, styles.imagePickerPlaceholder]}>
              <View style={[commonStyles.centered, styles.imageIconWrap]}>
                <AppIcon
                  name="photo"
                  size={ICON_SIZES.xxl}
                  color={COLORS.primary}
                  weight="medium"
                />
              </View>
              <Text style={styles.imagePickerTitle}>Add a photo</Text>
              <Text style={styles.imagePickerSubtitle}>Choose one from your library</Text>
            </View>
          </Pressable>
        )}
      </FormSection>

      <View style={styles.actions}>
        <PrimaryButton
          label={isSubmitting ? 'Saving…' : submitLabel}
          onPress={() => void handleSubmit(submitValues, focusFirstInvalidField)()}
          loading={isSubmitting}
          accessibilityHint="Saves this word to your vocabulary list"
        />

        {onDelete ? (
          <PrimaryButton
            label="Delete word"
            onPress={onDelete}
            variant="danger"
            disabled={isSubmitting}
            leading={
              <AppIcon name="trash" size={ICON_SIZES.md} color={COLORS.danger} />
            }
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: SPACING.xl,
  },
  previewCard: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    gap: SPACING.xs,
  },
  previewLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCardMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewArabic: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 42,
  },
  previewMeaning: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textOnDarkCard,
  },
  previewPlaceholder: {
    opacity: 0.45,
  },
  errorSummary: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderDanger,
    backgroundColor: COLORS.surfaceDanger,
  },
  errorSummaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.danger,
  },
  errorSummaryBody: {
    marginTop: 2,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    ...formCardShadow,
  },
  arabicInput: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    writingDirection: 'rtl',
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm + 2,
  },
  arabicMultilineInput: {
    fontSize: FONT_SIZES.xxl,
    lineHeight: 28,
    writingDirection: 'rtl',
  },
  exampleHeader: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  exampleBadge: {
    width: SIZES.stepBadge,
    height: SIZES.stepBadge,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
  },
  exampleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  exampleTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  addExample: {
    gap: SPACING.sm,
    minHeight: SIZES.primaryButtonHeight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
  },
  addExamplePressed: {
    backgroundColor: COLORS.surfaceAddButtonPressed,
  },
  addExampleLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  maxExamplesNote: {
    paddingHorizontal: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMutedSecondary,
  },
  imagePicker: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
  },
  imagePickerPressed: {
    backgroundColor: COLORS.surfaceAddButtonPressed,
  },
  imagePickerPlaceholder: {
    minHeight: 168,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  imageIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    marginBottom: SPACING.xs,
  },
  imagePickerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  imagePickerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  imageCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...formCardShadow,
  },
  previewImage: {
    width: '100%',
    height: SIZES.imagePreviewHeight,
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changePhotoBadgePressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  actions: {
    gap: SPACING.sm + 2,
    paddingTop: SPACING.xs,
  },
});
