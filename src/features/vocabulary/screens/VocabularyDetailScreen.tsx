import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BodyText, Subheading } from '@/components/StyledText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import type { Vocabulary } from '@/features/vocabulary/types';
import { createShadow } from '@/helpers/styleHelpers';

type VocabularyDetailScreenProps = {
  vocabulary: Vocabulary;
  onBack: () => void;
  onEdit: () => void;
};

const cardShadow = createShadow(2, COLORS.accent, 0.06, 4);

function formatAddedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function VocabularyDetailScreen({
  vocabulary,
  onBack,
  onEdit,
}: VocabularyDetailScreenProps) {
  const addedLabel = formatAddedDate(vocabulary.createdAt);
  const hasExamples = vocabulary.examples.length > 0;
  const hasDescription = Boolean(vocabulary.description?.trim());
  const hasImage = Boolean(vocabulary.imageUri?.trim());

  return (
    <ScreenScaffold contentContainerStyle={styles.scaffoldContent}>
      <ScreenHeader
        title="Vocabulary"
        onBack={onBack}
        rightAction={
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.editHeaderButton, pressed && styles.editHeaderPressed]}
            accessibilityRole="button"
            accessibilityLabel="Edit vocabulary"
          >
            <Text style={styles.editHeaderLabel}>Edit</Text>
          </Pressable>
        }
      />

      <View style={styles.heroCard}>
        <Text style={styles.heroArabic}>{vocabulary.arabicWord}</Text>
        <Text style={styles.heroMeaning}>{vocabulary.meaning}</Text>
      </View>

      {hasImage ? (
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Image</Subheading>
          <View style={styles.imageCard}>
            <Image
              source={{ uri: vocabulary.imageUri }}
              style={styles.image}
              contentFit="cover"
              accessibilityLabel="Vocabulary image"
            />
          </View>
        </View>
      ) : null}

      {hasExamples ? (
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Examples</Subheading>
          <View style={styles.examplesCard}>
            {vocabulary.examples.map((example, index) => (
              <View
                key={`${index}-${example.sentence}`}
                style={[
                  styles.exampleRow,
                  index !== vocabulary.examples.length - 1 && styles.exampleRowBorder,
                ]}
              >
                <View style={styles.exampleContent}>
                  <Text style={styles.exampleSentence}>{example.sentence}</Text>
                  {example.meaning?.trim() ? (
                    <Text style={styles.exampleMeaning}>{example.meaning}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {hasDescription ? (
        <View style={styles.section}>
          <Subheading style={styles.sectionTitle}>Notes</Subheading>
          <View style={styles.notesCard}>
            <BodyText style={styles.notesText}>{vocabulary.description}</BodyText>
          </View>
        </View>
      ) : null}

      {!hasExamples && !hasDescription && !hasImage ? (
        <View style={styles.hintCard}>
          <BodyText style={styles.hintText}>
            Tap Edit to add examples, notes, or an image to help you remember this word.
          </BodyText>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scaffoldContent: {
    paddingBottom: SPACING.section,
  },
  heroCard: {
    padding: SPACING.lg + 2,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  heroArabic: {
    fontSize: FONT_SIZES.hero,
    lineHeight: 40,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroMeaning: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
    lineHeight: 40,
  },
  heroMeta: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textOnDarkCardMuted,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  imageCard: {
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: COLORS.surfaceMuted,
  },
  examplesCard: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  exampleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  exampleBadge: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceWordIcon,
  },
  exampleBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.wordIconText,
  },
  exampleContent: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.xs,
  },
  exampleSentence: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  exampleMeaning: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMutedSecondary,
    lineHeight: 20,
  },
  notesCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...cardShadow,
  },
  notesText: {
    color: COLORS.textMutedSecondary,
    lineHeight: 22,
  },
  hintCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hintText: {
    textAlign: 'center',
    color: COLORS.textMuted,
  },
  editButton: {
    marginTop: SPACING.sm,
  },
  editHeaderButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  editHeaderPressed: {
    opacity: 0.7,
  },
  editHeaderLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
});
