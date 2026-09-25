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
import { IconButton } from '@/components/ui/IconButton';
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
  removeAllVocabulary,
  removeVocabularies,
  removeVocabulary,
} from '@/features/vocabulary/services/vocabularyService';
import { createShadow } from '@/helpers/styleHelpers';
import { appAlert } from '@/utils/appAlert';
import { commonStyles } from '@/styles/commonStyles';

type SelectionPurpose = 'export' | 'delete';

export function VocabularyListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectionPurpose, setSelectionPurpose] = useState<SelectionPurpose | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isShareBusy, setIsShareBusy] = useState(false);
  const [isImportBusy, setIsImportBusy] = useState(false);
  const [isDeleteBusy, setIsDeleteBusy] = useState(false);

  const isSelectionMode = selectionPurpose !== null;
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
    setSelectionPurpose(null);
    setSelectedIds(new Set());
  }, []);

  const enterSelectionMode = useCallback((purpose: SelectionPurpose) => {
    setSelectionPurpose(purpose);
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
          enterSelectionMode('export');
        },
      },
    ]);
  }, [enterSelectionMode, items.length, runExport]);

  const runBulkDelete = useCallback(
    async (ids: string[] | 'all') => {
      setIsDeleteBusy(true);

      try {
        const deletedCount =
          ids === 'all' ? await removeAllVocabulary() : await removeVocabularies(ids);
        exitSelectionMode();
        await loadItems(searchQuery);
        appAlert(
          'Deleted',
          `Removed ${deletedCount} word${deletedCount === 1 ? '' : 's'}.`,
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Could not delete vocabulary.';
        appAlert('Delete failed', message);
      } finally {
        setIsDeleteBusy(false);
      }
    },
    [exitSelectionMode, loadItems, searchQuery],
  );

  const confirmDeleteAll = useCallback(() => {
    // While a search is active, "all" means the words on screen, not the whole list.
    const isFiltered = searchQuery.trim().length > 0;
    const target = isFiltered ? items.map((item) => item.id) : 'all';

    appAlert(
      isFiltered ? 'Delete matching words' : 'Delete all vocabulary',
      `This removes ${isFiltered ? 'the' : 'all'} ${items.length} word${items.length === 1 ? '' : 's'}${isFiltered ? ' matching your search' : ''} and their practice history. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isFiltered ? 'Delete matching' : 'Delete all',
          style: 'destructive',
          onPress: () => {
            void runBulkDelete(target);
          },
        },
      ],
    );
  }, [items, runBulkDelete, searchQuery]);

  const confirmDeleteSelected = useCallback(() => {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) {
      appAlert('Select words', 'Choose at least one word to delete.');
      return;
    }

    appAlert(
      'Delete vocabulary',
      `Remove ${ids.length} selected word${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void runBulkDelete(ids);
          },
        },
      ],
    );
  }, [runBulkDelete, selectedIds]);

  const openDeleteMenu = useCallback(() => {
    if (items.length === 0) {
      appAlert('Nothing to delete', 'Your vocabulary list is already empty.');
      return;
    }

    appAlert('Delete vocabulary', 'Choose which words to remove.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Select words',
        onPress: () => {
          enterSelectionMode('delete');
        },
      },
      {
        text: searchQuery.trim().length > 0 ? 'Delete matching' : 'Delete all',
        style: 'destructive',
        onPress: confirmDeleteAll,
      },
    ]);
  }, [confirmDeleteAll, enterSelectionMode, items.length, searchQuery]);

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


  const isAllSelected = items.length > 0 && selectedCount === items.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? new Set() : new Set(items.map((item) => item.id)));
  }, [isAllSelected, items]);

  const headerTitle = isSelectionMode ? 'Select words' : 'Vocabulary';
  const isBusy = isShareBusy || isImportBusy || isDeleteBusy;
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const countLabel = `${items.length} ${isSearching ? 'result' : 'word'}${items.length === 1 ? '' : 's'}`;

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
        style={({ pressed }) => [
          styles.addIconButton,
          commonStyles.centered,
          pressed && styles.addIconButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add vocabulary"
      >
        <AppIcon
          name="plus"
          size={ICON_SIZES.lg}
          color={COLORS.textOnPrimary}
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
            ? selectionPurpose === 'delete'
              ? 'Tap words to mark them for deletion.'
              : 'Tap words to include in your export.'
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
        <View style={[commonStyles.row, commonStyles.alignCenter, styles.searchBar]}>
          <AppIcon name="search" size={ICON_SIZES.sm} color={COLORS.textMuted} weight="semibold" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Arabic or meaning"
            placeholderTextColor={COLORS.textMutedSecondary}
            selectionColor={COLORS.primary}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search vocabulary"
          />
          {isSearching ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <AppIcon
                name="xmarkCircle"
                size={ICON_SIZES.md}
                color={COLORS.chevron}
                weight="regular"
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={[commonStyles.row, commonStyles.alignCenter, styles.toolbar]}>
        {isSelectionMode ? (
          <>
            <Text style={styles.toolbarLabel}>
              {selectedCount} of {items.length} selected
            </Text>
            <View style={commonStyles.grow} />
            <Pressable
              onPress={toggleSelectAll}
              disabled={items.length === 0}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.toolbarLink}>
                {isAllSelected ? 'Deselect all' : 'Select all'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.toolbarLabel}>
              {isLoading && items.length === 0 ? ' ' : countLabel}
            </Text>
            <View style={commonStyles.grow} />
            <View style={[commonStyles.row, styles.toolbarActions]}>
              <IconButton
                icon="importDoc"
                onPress={handleImport}
                disabled={isImportBusy}
                accessibilityLabel="Import vocabulary from file"
                style={styles.toolbarButton}
              />
              <IconButton
                icon="share"
                onPress={openExportMenu}
                disabled={isShareBusy}
                accessibilityLabel="Export vocabulary to file"
                style={styles.toolbarButton}
              />
              <IconButton
                icon="trash"
                tone="danger"
                onPress={openDeleteMenu}
                disabled={isDeleteBusy}
                accessibilityLabel="Delete vocabulary"
                style={styles.toolbarButton}
              />
            </View>
          </>
        )}
      </View>

      {isBusy ? (
        <View style={[commonStyles.row, commonStyles.alignCenter, styles.busyBanner]}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.busyBannerText}>
            {isShareBusy ? 'Preparing export…' : isImportBusy ? 'Importing…' : 'Deleting…'}
          </Text>
        </View>
      ) : null}

      {isLoading && items.length === 0 ? (
        <View style={[commonStyles.grow, commonStyles.centered]}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : null}

      {!isLoading && loadError ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, styles.emptyIconDanger, commonStyles.centered]}>
            <AppIcon name="warning" size={ICON_SIZES.xxl} color={COLORS.danger} />
          </View>
          <Text style={styles.emptyTitle}>Could not load vocabulary</Text>
          <Text style={styles.emptyBody}>{loadError}</Text>
          <PrimaryButton
            label="Try again"
            variant="secondary"
            onPress={() => void loadItems(searchQuery)}
            style={styles.emptyButton}
          />
        </View>
      ) : null}

      {!isLoading && !loadError && items.length === 0 && isSearching ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, commonStyles.centered]}>
            <AppIcon name="search" size={ICON_SIZES.xxl} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptyBody}>
            Nothing in your collection matches “{trimmedQuery}”.
          </Text>
          <Pressable
            onPress={() => setSearchQuery('')}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.emptyLink}>Clear search</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && !loadError && items.length === 0 && !isSearching ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, commonStyles.centered]}>
            <AppIcon name="book" size={ICON_SIZES.xxl} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No vocabulary yet</Text>
          <Text style={styles.emptyBody}>
            Add your first word, or import a collection someone shared with you.
          </Text>
          <PrimaryButton
            label="Add a word"
            onPress={() => router.push('/vocabulary/new')}
            leading={
              <AppIcon name="plus" size={ICON_SIZES.md} color={COLORS.textOnPrimary} weight="bold" />
            }
            style={styles.emptyButton}
          />
          <PrimaryButton
            label="Import from file"
            onPress={handleImport}
            variant="secondary"
            leading={
              <AppIcon name="importDoc" size={ICON_SIZES.md} color={COLORS.primary} weight="bold" />
            }
            style={styles.emptyButtonSecondary}
          />
        </View>
      ) : null}

      {!loadError && items.length > 0 ? (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={[
            styles.listContent,
            isSelectionMode && styles.listContentWithFooter,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.list}>
            {items.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              const details = describeVocabularyDetails(item);

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
                  accessibilityRole={isSelectionMode ? 'checkbox' : 'button'}
                  accessibilityState={isSelectionMode ? { checked: isSelected } : undefined}
                  accessibilityLabel={`${item.meaning}, ${item.arabicWord}`}
                  accessibilityHint={isSelectionMode ? undefined : 'Long press to delete'}
                  style={({ pressed }) => [
                    styles.row,
                    commonStyles.row,
                    commonStyles.alignCenter,
                    index !== items.length - 1 && styles.rowBorder,
                    isSelectionMode && isSelected && styles.rowSelected,
                    pressed && styles.rowPressed,
                  ]}
                >
                  {isSelectionMode ? (
                    <AppIcon
                      name={isSelected ? 'checkmarkCircle' : 'circle'}
                      size={ICON_SIZES.xl}
                      color={
                        isSelected
                          ? selectionPurpose === 'delete'
                            ? COLORS.danger
                            : COLORS.primary
                          : COLORS.chevron
                      }
                      weight="semibold"
                    />
                  ) : null}

                  <View style={styles.rowText}>
                    <Text style={styles.meaning} numberOfLines={1}>
                      {item.meaning}
                    </Text>
                    {details ? (
                      <Text style={styles.rowMeta} numberOfLines={1}>
                        {details}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.arabicWord} numberOfLines={1}>
                    {item.arabicWord}
                  </Text>

                  {!isSelectionMode ? (
                    <AppIcon
                      name="chevronRight"
                      size={ICON_SIZES.sm - 2}
                      color={COLORS.chevron}
                      weight="bold"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      {isSelectionMode ? (
        <View style={styles.selectionFooter}>
          {selectionPurpose === 'delete' ? (
            <PrimaryButton
              label={
                selectedCount === 0
                  ? 'Delete selected'
                  : `Delete ${selectedCount} word${selectedCount === 1 ? '' : 's'}`
              }
              variant="danger"
              onPress={confirmDeleteSelected}
              disabled={isDeleteBusy || selectedCount === 0}
              leading={
                <AppIcon name="trash" size={ICON_SIZES.md} color={COLORS.danger} weight="bold" />
              }
            />
          ) : (
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
              leading={
                <AppIcon name="share" size={ICON_SIZES.md} color={COLORS.textOnPrimary} weight="bold" />
              }
            />
          )}
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

/** Summarises the optional study material attached to a word, e.g. "2 examples · Notes". */
function describeVocabularyDetails(item: Vocabulary): string {
  const parts: string[] = [];
  const exampleCount = item.examples.length;

  if (exampleCount > 0) {
    parts.push(`${exampleCount} example${exampleCount === 1 ? '' : 's'}`);
  }
  if (item.description?.trim()) {
    parts.push('Notes');
  }
  if (item.imageUri?.trim()) {
    parts.push('Image');
  }

  return parts.join(' · ');
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
  addIconButton: {
    width: SIZES.headerIconButton,
    height: SIZES.headerIconButton,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  addIconButtonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  pressed: {
    opacity: 0.6,
  },
  searchBar: {
    minHeight: 46,
    paddingHorizontal: SPACING.md - 2,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  toolbar: {
    minHeight: SIZES.iconButton + SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  toolbarLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
  toolbarLink: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  toolbarActions: {
    gap: SPACING.sm,
  },
  toolbarButton: {
    width: 36,
    height: 36,
  },
  busyBanner: {
    alignSelf: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md - 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surfaceMuted,
  },
  busyBannerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
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
    minHeight: SIZES.wordRowMinHeight - 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.md - 4,
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
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  meaning: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  rowMeta: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMutedSecondary,
  },
  arabicWord: {
    flexShrink: 1,
    maxWidth: '50%',
    fontSize: FONT_SIZES.display - 2,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.arabicWord,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.section,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.surfaceMuted,
  },
  emptyIconDanger: {
    backgroundColor: COLORS.surfaceDanger,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  emptyBody: {
    maxWidth: 300,
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
  },
  emptyButtonSecondary: {
    marginTop: SPACING.sm,
    alignSelf: 'stretch',
  },
  emptyLink: {
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
