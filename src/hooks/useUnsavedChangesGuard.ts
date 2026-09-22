import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { appAlert } from '@/utils/appAlert';

type GuardCopy = {
  title: string;
  message: string;
  discardLabel?: string;
};

/**
 * Confirms before a screen with unsaved edits is popped (header back, hardware
 * back, or swipe). Returns a bypass callback to call right before navigating
 * away on purpose, e.g. after a successful save.
 */
export function useUnsavedChangesGuard(
  hasUnsavedChanges: boolean,
  { title, message, discardLabel = 'Discard' }: GuardCopy,
) {
  const navigation = useNavigation();
  const bypassRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!hasUnsavedChanges || bypassRef.current) {
        return;
      }

      event.preventDefault();

      appAlert(title, message, [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: discardLabel,
          style: 'destructive',
          onPress: () => {
            bypassRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, title, message, discardLabel]);

  return useCallback(() => {
    bypassRef.current = true;
  }, []);
}
