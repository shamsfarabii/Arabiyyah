import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TextField } from '@/components/ui/TextField';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SPACING,
} from '@/constants/theme';
import { MAX_VOCABULARY_EXAMPLES } from '@/features/vocabulary/constants';
import {
  vocabularySchema,
  type VocabularyFormValues,
  type VocabularyValidatedInput,
} from '@/features/vocabulary/schemas/vocabularySchema';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

type VocabularyFormProps = {
  initialValues?: Partial<VocabularyFormValues>;
  submitLabel: string;
  onSubmit: (values: VocabularyValidatedInput) => Promise<void>;
  onDelete?: () => void;
};

const emptyDefaults: VocabularyFormValues = {
  arabicWord: '',
  meaning: '',
  examples: [],
  description: '',
  imageUri: '',
};

const formCardShadow = createShadow(2, COLORS.accent, 0.05, 3);

export function VocabularyForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
}: VocabularyFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VocabularyFormValues, unknown, VocabularyValidatedInput>({
    resolver: zodResolver(vocabularySchema),
    defaultValues: {
      ...emptyDefaults,
      ...initialValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'examples',
  });

  const imageUri = watch('imageUri');

  const handleChooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access to attach a vocabulary image.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setValue('imageUri', result.assets[0].uri, { shouldDirty: true });
    }
  };

  const handleSave = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not save vocabulary.';
      Alert.alert('Save failed', message);
    }
  });

  return (
    <View style={styles.form}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Word details</Text>
        <View style={styles.sectionCard}>
          <Controller
            control={control}
            name="arabicWord"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Arabic Word"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.arabicWord?.message}
                autoCorrect={false}
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
                label="Meaning"
                required
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.meaning?.message}
                autoCorrect={false}
                style={styles.lastFieldInCard}
              />
            )}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Examples</Text>
        <Text style={styles.sectionHint}>
          Optional — add up to {MAX_VOCABULARY_EXAMPLES} sentences that use this word.
        </Text>
        {fields.map((field, index) => (
          <View key={field.id} style={styles.sectionCard}>
            <View style={styles.exampleHeader}>
              <Text style={styles.exampleTitle}>Example {index + 1}</Text>
              <Pressable
                onPress={() => remove(index)}
                accessibilityRole="button"
                accessibilityLabel={`Remove example ${index + 1}`}
                style={({ pressed }) => [pressed && styles.removeExamplePressed]}
              >
                <Text style={styles.removeExampleText}>Remove</Text>
              </Pressable>
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
                  multiline
                  textAlign="right"
                  style={styles.multilineInput}
                />
              )}
            />

            <Controller
              control={control}
              name={`examples.${index}.meaning`}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Meaning"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.examples?.[index]?.meaning?.message}
                  multiline
                  style={[styles.multilineInput, styles.lastFieldInCard]}
                />
              )}
            />
          </View>
        ))}

        {fields.length < MAX_VOCABULARY_EXAMPLES ? (
          <PrimaryButton
            label="Add example"
            variant="secondary"
            onPress={() => append({ sentence: '', meaning: '' })}
            trailing={
              <AppIcon
                name="plus"
                size={ICON_SIZES.md}
                color={COLORS.primary}
                weight="semibold"
              />
            }
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>More context</Text>
        <View style={styles.sectionCard}>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Description"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                style={[styles.multilineInput, styles.lastFieldInCard]}
              />
            )}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Image</Text>
        <Text style={styles.sectionHint}>Optional — a visual cue can strengthen recall.</Text>
        <Pressable
          onPress={handleChooseImage}
          style={({ pressed }) => [
            styles.imagePicker,
            imageUri ? styles.imagePickerFilled : styles.imagePickerEmpty,
            pressed && styles.imagePickerPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={imageUri ? 'Change vocabulary image' : 'Add vocabulary image'}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <View style={[styles.changePhotoBadge, commonStyles.centered]}>
                <Text style={styles.changePhotoText}>Change photo</Text>
              </View>
            </>
          ) : (
            <View style={[commonStyles.centered, styles.imagePickerPlaceholder]}>
              <View style={[commonStyles.centered, styles.imageIconWrap]}>
                <AppIcon
                  name="photo"
                  size={ICON_SIZES.xl}
                  color={COLORS.primary}
                  weight="medium"
                />
              </View>
              <Text style={styles.imagePickerTitle}>Add photo</Text>
              <Text style={styles.imagePickerSubtitle}>Tap to choose from your library</Text>
            </View>
          )}
        </Pressable>
      </View>

      <PrimaryButton
        label={isSubmitting ? 'Saving…' : submitLabel}
        onPress={handleSave}
        disabled={isSubmitting}
        style={styles.saveButton}
      />

      {onDelete ? (
        <PrimaryButton
          label="Delete Vocabulary"
          onPress={onDelete}
          variant="danger"
          disabled={isSubmitting}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionLabel: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHint: {
    marginLeft: SPACING.xs,
    marginBottom: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMutedSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    ...formCardShadow,
  },
  arabicInput: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm + 2,
  },
  lastFieldInCard: {
    marginBottom: SPACING.sm,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  exampleTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
  },
  removeExampleText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
  },
  removeExamplePressed: {
    opacity: 0.7,
  },
  imagePicker: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...formCardShadow,
  },
  imagePickerEmpty: {
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
  },
  imagePickerFilled: {
    minHeight: 200,
  },
  imagePickerPressed: {
    opacity: 0.92,
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
  previewImage: {
    width: '100%',
    height: 220,
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
  changePhotoText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  saveButton: {
    marginTop: SPACING.xs,
  },
});
