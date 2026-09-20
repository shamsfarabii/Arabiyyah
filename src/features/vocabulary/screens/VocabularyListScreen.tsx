import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
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
import type { Vocabulary } from '@/features/vocabulary/types';
import {
  listVocabulary,
  removeVocabulary,
} from '@/features/vocabulary/services/vocabularyService';
import { createShadow } from '@/helpers/styleHelpers';
import { commonStyles } from '@/styles/commonStyles';

export function VocabularyListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadItems = useCallback(async (query: string) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const results = await listVocabulary(query);
      setItems(results);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Could not load vocabulary.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems(searchQuery);
    }, [loadItems, searchQuery]),
  );

  const handleDelete = (item: Vocabulary) => {
    Alert.alert(
      'Delete vocabulary',
      `Remove "${item.arabicWord}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await removeVocabulary(item.id);
                await loadItems(searchQuery);
              } catch (error: unknown) {
                const message =
                  error instanceof Error ? error.message : 'Could not delete vocabulary.';
                Alert.alert('Delete failed', message);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScreenScaffold scroll={false}>
      <ScreenHeader
        title="Vocabulary"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push('/vocabulary/new')}
            style={({ pressed }) => [styles.addIconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add vocabulary"
          >
            <AppIcon
              name="plus"
              size={ICON_SIZES.lg}
              color={COLORS.primary}
              weight="bold"
            />
          </Pressable>
        }
      />

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search..."
        placeholderTextColor={COLORS.textMuted}
        style={styles.searchInput}
        autoCorrect={false}
      />

      {isLoading ? (
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Could not load vocabulary</Text>
          <Text style={styles.emptyBody}>{loadError}</Text>
          <Pressable onPress={() => void loadItems(searchQuery)}>
            <Text style={styles.retryLink}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !loadError && items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No vocabulary yet</Text>
          <Text style={styles.emptyBody}>Add your first word to start learning.</Text>
        </View>
      ) : null}

      {!isLoading && !loadError && items.length > 0 ? (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.list}>
            {items.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/vocabulary/${item.id}`)}
                onLongPress={() => handleDelete(item)}
                style={({ pressed }) => [
                  styles.row,
                  index !== items.length - 1 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.entryTextRow}>
                  <Text style={styles.meaning} numberOfLines={1}>
                    {item.meaning}
                  </Text>
                  <Text style={styles.arabicWord} numberOfLines={1}>
                    {item.arabicWord}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </ScreenScaffold>
  );
}

const listShadow = createShadow(2, COLORS.accent, 0.06, 4);

const styles = StyleSheet.create({
  addIconButton: {
    width: SIZES.headerIconButton,
    height: SIZES.headerIconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pressed: {
    opacity: 0.7,
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    flexGrow: 0,
  },
  list: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    ...listShadow,
  },
  row: {
    minHeight: 72,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: 'stretch',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  entryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: SPACING.md,
    minWidth: 0,
  },
  arabicWord: {
    flexShrink: 0,
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
  },
  meaning: {
    flex: 1,
    flexShrink: 1,
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMutedSecondary,
    textAlign: 'left',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyBody: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  retryLink: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
});
