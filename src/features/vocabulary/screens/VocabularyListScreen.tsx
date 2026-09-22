import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
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
import type { Vocabulary } from '@/features/vocabulary/types';
import {
  importVocabularyFromFile,
  loadVocabularyForExport,
  pickAndParseVocabularyImportFile,
  shareVocabularyExport,
} from '@/features/vocabulary/services/vocabularyImportExportService';
import {
  listVocabulary,
  removeVocabulary,
} from '@/features/vocabulary/services/vocabularyService';
import { createShadow } from '@/helpers/styleHelpers';
import { appAlert } from '@/utils/appAlert';
import { commonStyles } from '@/styles/commonStyles';

export function VocabularyListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isShareBusy, setIsShareBusy] = useState(false);
  const [isImportBusy, setIsImportBusy] = useState(false);

  const selectedCount = selectedIds.size;

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

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const runExport = useCallback(
    async (ids?: string[]) => {
      setIsShareBusy(true);

      try {
        const vocabularies = await loadVocabularyForExport(ids);
        await shareVocabularyExport(vocabularies);
        exitSelectionMode();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not export vocabulary.';
        appAlert('Export failed', message);
      } finally {
        setIsShareBusy(false);
      }
    },
    [exitSelectionMode],
  );

  const confirmImport = useCallback(
    (file: NonNullable<Awaited<ReturnType<typeof pickAndParseVocabularyImportFile>>>) => {
      appAlert(
        'Import vocabulary',
        `This file contains ${file.items.length} word${file.items.length === 1 ? '' : 's'}. How should duplicates (same Arabic word and meaning) be handled?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip duplicates',
            onPress: () => {
              void (async () => {
                setIsImportBusy(true);
                try {
                  const result = await importVocabularyFromFile(file, 'skip');
                  await loadItems(searchQuery);
                  appAlert(
                    'Import complete',
                    `Added ${result.importedCount} word${result.importedCount === 1 ? '' : 's'}.${result.skippedDuplicateCount > 0 ? ` Skipped ${result.skippedDuplicateCount} duplicate${result.skippedDuplicateCount === 1 ? '' : 's'}.` : ''}`,
                  );
                } catch (error: unknown) {
                  const message =
                    error instanceof Error ? error.message : 'Could not import vocabulary.';
                  appAlert('Import failed', message);
                } finally {
                  setIsImportBusy(false);
                }
              })();
            },
          },
          {
            text: 'Import all',
            onPress: () => {
              void (async () => {
                setIsImportBusy(true);
                try {
                  const result = await importVocabularyFromFile(file, 'import');
                  await loadItems(searchQuery);
                  appAlert(
                    'Import complete',
                    `Added ${result.importedCount} word${result.importedCount === 1 ? '' : 's'}.`,
                  );
                } catch (error: unknown) {
                  const message =
                    error instanceof Error ? error.message : 'Could not import vocabulary.';
                  appAlert('Import failed', message);
                } finally {
                  setIsImportBusy(false);
                }
              })();
            },
          },
        ],
      );
    },
    [loadItems, searchQuery],
  );

  const handleImport = useCallback(() => {
    void (async () => {
      setIsImportBusy(true);
      try {
        const file = await pickAndParseVocabularyImportFile();
        if (!file) {
          return;
        }
        confirmImport(file);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not read vocabulary file.';
        appAlert('Import failed', message);
      } finally {
        setIsImportBusy(false);
      }
    })();
  }, [confirmImport]);

  const openExportMenu = useCallback(() => {
    if (items.length === 0) {
      appAlert(
        'Nothing to export',
        'Add vocabulary first, or import a collection from another user.',
      );
      return;
    }

    appAlert('Export collection', 'Choose which words to include in the JSON file.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export all',
        onPress: () => {
          void runExport();
        },
      },
      {
        text: 'Select words',
        onPress: () => {
          setIsSelectionMode(true);
          setSelectedIds(new Set());
        },
      },
    ]);
  }, [items.length, runExport]);

  const handleDelete = (item: Vocabulary) => {
    appAlert(
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
                setSelectedIds((previous) => {
                  if (!previous.has(item.id)) {
                    return previous;
                  }
                  const next = new Set(previous);
                  next.delete(item.id);
                  return next;
                });
                await loadItems(searchQuery);
              } catch (error: unknown) {
                const message =
                  error instanceof Error ? error.message : 'Could not delete vocabulary.';
                appAlert('Delete failed', message);
              }
            })();
          },
        },
      ],
    );
  };

  const headerTitle = isSelectionMode ? 'Select words' : 'Vocabulary';
  const isBusy = isShareBusy || isImportBusy;

  const headerRight = useMemo(() => {
    if (isSelectionMode) {
      return (
        <Pressable
          onPress={exitSelectionMode}
          style={({ pressed }) => [styles.headerTextAction, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Cancel selection"
        >
          <Text style={styles.headerTextActionLabel}>Cancel</Text>
        </Pressable>
      );
    }

    return (
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
    );
  }, [exitSelectionMode, isSelectionMode]);

  return (
    <ScreenScaffold scroll={false}>
      <ScreenHeader
        title={headerTitle}
        subtitle={
          isSelectionMode
            ? selectedCount === 0
              ? 'Tap words to include in your export.'
              : `${selectedCount} selected`
            : undefined
        }
        onBack={() => {
          if (isSelectionMode) {
            exitSelectionMode();
            return;
          }
          router.back();
        }}
        rightAction={headerRight}
      />

      {!isSelectionMode ? (
        <>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
          />
          <View style={styles.collectionActions}>
            <Pressable
              onPress={handleImport}
              disabled={isImportBusy}
              style={({ pressed }) => [
                styles.collectionActionButton,
                isImportBusy && styles.collectionActionDisabled,
                pressed && !isImportBusy && styles.collectionActionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Import vocabulary from file"
            >
              <AppIcon
                name="importDoc"
                size={ICON_SIZES.md}
                color={COLORS.primary}
                weight="bold"
              />
              <Text style={styles.collectionActionLabel}>Import</Text>
            </Pressable>
            <Pressable
              onPress={openExportMenu}
              disabled={isShareBusy}
              style={({ pressed }) => [
                styles.collectionActionButton,
                isShareBusy && styles.collectionActionDisabled,
                pressed && !isShareBusy && styles.collectionActionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Export vocabulary to file"
            >
              <AppIcon
                name="share"
                size={ICON_SIZES.md}
                color={COLORS.primary}
                weight="bold"
              />
              <Text style={styles.collectionActionLabel}>Export</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {isBusy ? (
        <View style={styles.busyBanner}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.busyBannerText}>
            {isShareBusy ? 'Preparing export…' : 'Importing…'}
          </Text>
        </View>
      ) : null}

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
          <Text style={styles.emptyBody}>Add your first word or import a shared collection.</Text>
          <PrimaryButton
            label="Import from file"
            onPress={handleImport}
            variant="secondary"
            style={styles.emptyImportButton}
          />
        </View>
      ) : null}

      {!isLoading && !loadError && items.length > 0 ? (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={[
            styles.listContent,
            isSelectionMode && styles.listContentWithFooter,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.list}>
            {items.map((item, index) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (isSelectionMode) {
                      toggleSelected(item.id);
                      return;
                    }
                    router.push(`/vocabulary/${item.id}`);
                  }}
                  onLongPress={() => {
                    if (!isSelectionMode) {
                      handleDelete(item);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    index !== items.length - 1 && styles.rowBorder,
                    pressed && styles.rowPressed,
                    isSelectionMode && isSelected && styles.rowSelected,
                  ]}
                >
                  {isSelectionMode ? (
                    <AppIcon
                      name={isSelected ? 'checkmarkCircle' : 'circle'}
                      size={ICON_SIZES.lg}
                      color={isSelected ? COLORS.primary : COLORS.textMuted}
                      weight="bold"
                    />
                  ) : null}
                  <View style={[styles.entryTextRow, isSelectionMode && styles.entryTextRowCompact]}>
                    <Text style={styles.meaning} numberOfLines={1}>
                      {item.meaning}
                    </Text>
                    <Text style={styles.arabicWord} numberOfLines={1}>
                      {item.arabicWord}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {isSelectionMode ? (
        <View style={styles.selectionFooter}>
          <PrimaryButton
            label={
              selectedCount === 0
                ? 'Export selected'
                : `Export ${selectedCount} word${selectedCount === 1 ? '' : 's'}`
            }
            onPress={() => {
              if (selectedCount === 0) {
                appAlert('Select words', 'Choose at least one word to export.');
                return;
              }
              void runExport(Array.from(selectedIds));
            }}
            disabled={isShareBusy || selectedCount === 0}
          />
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const listShadow = createShadow(2, COLORS.accent, 0.06, 4);

const styles = StyleSheet.create({
  headerTextAction: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    minHeight: SIZES.headerIconButton,
    justifyContent: 'center',
  },
  headerTextActionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  headerActionDisabled: {
    opacity: 0.5,
  },
  collectionActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  collectionActionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  collectionActionPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  collectionActionDisabled: {
    opacity: 0.5,
  },
  collectionActionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
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
  busyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  busyBannerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
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
  listContentWithFooter: {
    paddingBottom: SPACING.xl,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rowPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  rowSelected: {
    backgroundColor: COLORS.surfaceMuted,
  },
  entryTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: SPACING.md,
    minWidth: 0,
    flex: 1,
  },
  entryTextRowCompact: {
    flex: 1,
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
  emptyImportButton: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
    maxWidth: 320,
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
  selectionFooter: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
