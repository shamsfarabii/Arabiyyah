import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';
import { createShadow } from '@/helpers/styleHelpers';
import {
  registerAppAlertHandler,
  type AppAlertButton,
  type AppAlertRequest,
} from '@/utils/appAlert';

type AppAlertProviderProps = {
  children: ReactNode;
};

const cardShadow = createShadow(8, COLORS.accent, 0.12, 16);

function orderButtons(buttons: AppAlertButton[]): AppAlertButton[] {
  const cancelButtons = buttons.filter((button) => button.style === 'cancel');
  const otherButtons = buttons.filter((button) => button.style !== 'cancel');
  return [...otherButtons, ...cancelButtons];
}

function resolveButtonVariant(
  button: AppAlertButton,
  index: number,
  orderedButtons: AppAlertButton[],
): 'primary' | 'secondary' | 'danger' {
  if (button.style === 'destructive') {
    return 'danger';
  }

  if (button.style === 'cancel') {
    return 'secondary';
  }

  const actionable = orderedButtons.filter(
    (entry) => entry.style !== 'cancel' && entry.style !== 'destructive',
  );
  const primaryIndex = orderedButtons.indexOf(actionable[actionable.length - 1]);

  if (index === primaryIndex) {
    return 'primary';
  }

  return 'secondary';
}

export function AppAlertProvider({ children }: AppAlertProviderProps) {
  const [queue, setQueue] = useState<AppAlertRequest[]>([]);
  const active = queue[0] ?? null;

  const dismissActive = useCallback(() => {
    setQueue((previous) => previous.slice(1));
  }, []);

  const enqueue = useCallback((request: AppAlertRequest) => {
    setQueue((previous) => [...previous, request]);
  }, []);

  useEffect(() => {
    registerAppAlertHandler(enqueue);
    return () => registerAppAlertHandler(null);
  }, [enqueue]);

  const handleButtonPress = (button: AppAlertButton) => {
    dismissActive();
    button.onPress?.();
  };

  const handleRequestClose = () => {
    if (!active) {
      return;
    }

    const cancelButton = active.buttons.find((button) => button.style === 'cancel');
    if (cancelButton) {
      handleButtonPress(cancelButton);
      return;
    }

    dismissActive();
  };

  const orderedButtons = active ? orderButtons(active.buttons) : [];

  return (
    <>
      {children}
      <Modal
        visible={active !== null}
        transparent
        animationType="fade"
        onRequestClose={handleRequestClose}
        statusBarTranslucent
      >
        <View style={styles.overlay} accessibilityViewIsModal>
          <View style={styles.backdrop} />
          {active ? (
            <View style={styles.card}>
              <Text style={styles.title} accessibilityRole="header">
                {active.title}
              </Text>
              {active.message ? (
                <Text style={styles.message}>{active.message}</Text>
              ) : null}
              <View style={styles.actions}>
                {orderedButtons.map((button, index) => (
                  <PrimaryButton
                    key={`${button.text}-${index}`}
                    label={button.text}
                    variant={resolveButtonVariant(button, index, orderedButtons)}
                    onPress={() => handleButtonPress(button)}
                    style={styles.actionButton}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.imageScrim,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.hero,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
    ...cardShadow,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionButton: {
    width: '100%',
  },
});
