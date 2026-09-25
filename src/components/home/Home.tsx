import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { AddVocabularyButton } from '@/components/home/AddVocabularyButton';
import { buildHomeView } from '@/components/home/buildHomeView';
import { HomeHeader } from '@/components/home/HomeHeader';
import {
  HOME_COMPACT_MAX_WIDTH,
  HOME_CONTENT_MAX_WIDTH,
  HOME_WIDE_MIN_WIDTH,
} from '@/components/home/homeLayout';
import { PracticeSection } from '@/components/home/PracticeSection';
import { RecentWordsSection } from '@/components/home/RecentWordsSection';
import { useHomeSummary } from '@/components/home/useHomeSummary';
import { VocabularyHeroCard } from '@/components/home/VocabularyHeroCard';
import { COLORS, SPACING } from '@/constants/theme';

export function Home() {
  const { summary, isLoading } = useHomeSummary();
  const { width } = useWindowDimensions();
  const view = buildHomeView(summary, isLoading);

  const isCompact = width < HOME_COMPACT_MAX_WIDTH;
  const isWide = width >= HOME_WIDE_MIN_WIDTH;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isCompact && styles.scrollContentCompact,
          isWide && styles.scrollContentWide,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <HomeHeader isCompact={isCompact} />
          <VocabularyHeroCard
            isCompact={isCompact}
            totalWordsText={view.totalWordsText}
            collectedLabel={view.collectedLabel}
            accessibilityLabel={view.vocabularyAccessibilityLabel}
            stats={view.stats}
          />
          <PracticeSection
            isWide={isWide}
            review={view.review}
            quizDescription={view.quizDescription}
          />
          <RecentWordsSection
            isLoading={isLoading}
            isCompact={isCompact}
            items={view.recentItems}
          />
          <AddVocabularyButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.section + SPACING.md,
  },
  scrollContentCompact: {
    paddingHorizontal: SPACING.md,
  },
  scrollContentWide: {
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.xl,
  },
  content: {
    width: '100%',
    maxWidth: HOME_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
