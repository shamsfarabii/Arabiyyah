import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SIZES,
  SPACING,
} from '@/constants/theme';
import { MAX_VOCABULARY_EXAMPLES } from '@/features/vocabulary/constants';
import type { Vocabulary } from '@/features/vocabulary/types';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

type VocabularyDetailScreenProps = {
  vocabulary: Vocabulary;
  onBack: () => void;
  onEdit: () => void;
};

const cardShadow = createShadow(2, COLORS.accent, 0.06, 4);
const heroShadow = createShadow(6, COLORS.accent, 0.18, 12);

function formatDate(isoDate: string): string {
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

type SectionProps = {
  icon: AppIconName;
  title: string;
  count?: number;
  children: ReactNode;
};

function Section({ icon, title, count, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={[commonStyles.row, commonStyles.alignCenter, styles.sectionHeader]}>
        <AppIcon name={icon} size={ICON_SIZES.sm - 2} color={COLORS.textMuted} weight="semibold" />
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {typeof count === 'number' ? <Text style={styles.sectionCount}>{count}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function VocabularyDetailScreen({
  vocabulary,
  onBack,
  onEdit,
}: VocabularyDetailScreenProps) {
  const displayExamples = vocabulary.examples.slice(0, MAX_VOCABULARY_EXAMPLES);
  const hasExamples = displayExamples.length > 0;
  const hasDescription = Boolean(vocabulary.description?.trim());
  const hasImage = Boolean(vocabulary.imageUri?.trim());

  const addedOn = formatDate(vocabulary.createdAt);
  const updatedOn = formatDate(vocabulary.updatedAt);
  const showUpdated = Boolean(updatedOn) && updatedOn !== addedOn;

  return (
    <ScreenScaffold contentContainerStyle={styles.scaffoldContent}>
      <ScreenHeader
        title="Word"
        onBack={onBack}
        rightAction={
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [
              styles.editHeaderButton,
              commonStyles.centered,
              pressed && styles.editHeaderPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit vocabulary"
          >
            <AppIcon name="pencil" size={ICON_SIZES.md} color={COLORS.primary} weight="bold" />
          </Pressable>
        }
      />

      <View style={styles.heroCard}>
        <View style={styles.heroDecoration} pointerEvents="none" />
        <View style={[styles.heroDecoration, styles.heroDecorationSmall]} pointerEvents="none" />

        <Text style={styles.heroArabic} accessibilityLanguage="ar">
          {vocabulary.arabicWord}
        </Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroMeaning}>{vocabulary.meaning}</Text>

        {addedOn ? (
          <View style={[commonStyles.row, commonStyles.centered, styles.heroMetaRow]}>
            <AppIcon
              name="calendar"
              size={ICON_SIZES.sm - 4}
              color={COLORS.textOnDarkCardMuted}
              weight="semibold"
            />
            <Text style={styles.heroMeta}>
              Added {addedOn}
              {showUpdated ? `  ·  Updated ${updatedOn}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {hasExamples ? (
        <Section icon="quote" title="Examples" count={displayExamples.length}>
          <View style={styles.card}>
            {displayExamples.map((example, index) => (
              <View
                key={`${index}-${example.sentence}`}
                style={[
                  commonStyles.row,
                  styles.exampleRow,
                  index !== displayExamples.length - 1 && styles.exampleRowBorder,
                ]}
              >
                <View style={[styles.exampleBadge, commonStyles.centered]}>
                  <Text style={styles.exampleBadgeText}>{index + 1}</Text>
                </View>
                <View style={styles.exampleContent}>
                  <Text style={styles.exampleSentence} accessibilityLanguage="ar">
                    {example.sentence}
                  </Text>
                  {example.meaning?.trim() ? (
                    <Text style={styles.exampleMeaning}>{example.meaning}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {hasDescription ? (
        <Section icon="notes" title="Notes">
          <View style={[styles.card, styles.notesCard]}>
            <Text style={styles.notesText}>{vocabulary.description}</Text>
          </View>
        </Section>
      ) : null}

      {hasImage ? (
        <Section icon="photo" title="Image">
          <View style={styles.card}>
            <Image
              source={{ uri: vocabulary.imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={150}
              accessibilityLabel={`Image for ${vocabulary.meaning}`}
            />
          </View>
        </Section>
      ) : null}

      {!hasExamples && !hasDescription && !hasImage ? (
        <View style={styles.emptyCard}>
          <View style={[styles.emptyIcon, commonStyles.centered]}>
            <AppIcon name="notes" size={ICON_SIZES.xl} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Make it memorable</Text>
          <Text style={styles.emptyBody}>
            Add example sentences, notes, or an image to help this word stick.
          </Text>
          <PrimaryButton
            label="Add details"
            variant="secondary"
            onPress={onEdit}
            leading={
              <AppIcon name="plus" size={ICON_SIZES.md} color={COLORS.primary} weight="bold" />
            }
            style={styles.emptyButton}
          />
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scaffoldContent: {
    paddingBottom: SPACING.section,
  },
  editHeaderButton: {
    width: SIZES.headerIconButton,
    height: SIZES.headerIconButton,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editHeaderPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  heroCard: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 4,
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.hero,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    overflow: 'hidden',
    ...heroShadow,
  },
  heroDecoration: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.decorationOverlay,
  },
  heroDecorationSmall: {
    top: undefined,
    right: undefined,
    bottom: -40,
    left: -30,
    width: 110,
    height: 110,
  },
  heroArabic: {
    fontSize: FONT_SIZES.stat - 4,
    lineHeight: 60,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  heroDivider: {
    width: 36,
    height: 2,
    marginVertical: SPACING.md - 4,
    borderRadius: 1,
    backgroundColor: COLORS.textOnDarkCardMuted,
    opacity: 0.4,
  },
  heroMeaning: {
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 26,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textOnDarkCard,
    textAlign: 'center',
  },
  heroMetaRow: {
    marginTop: SPACING.lg,
    gap: SPACING.xs + 2,
  },
  heroMeta: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textOnDarkCardMuted,
    fontVariant: ['tabular-nums'],
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    marginBottom: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceMuted,
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  card: {
    borderRadius: BORDER_RADIUS.xxl,
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
  exampleRow: {
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md - 4,
  },
  exampleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  exampleBadge: {
    width: SIZES.stepBadge,
    height: SIZES.stepBadge,
    marginTop: 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceWordIcon,
  },
  exampleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.wordIconText,
    fontVariant: ['tabular-nums'],
  },
  exampleContent: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.xs + 2,
  },
  exampleSentence: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 32,
  },
  exampleMeaning: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMutedSecondary,
    lineHeight: 20,
  },
  notesCard: {
    padding: SPACING.md,
  },
  notesText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    lineHeight: 23,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.addButtonBorder,
    backgroundColor: COLORS.surfaceAddButton,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyBody: {
    maxWidth: 280,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
  },
});
