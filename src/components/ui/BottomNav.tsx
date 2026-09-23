import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_SIZES,
  SPACING,
} from '@/constants/theme';
import { createShadow } from '@/helpers/styleHelpers';

type NavKey = 'home' | 'quiz' | 'review' | 'settings';

type NavItem = {
  key: NavKey;
  label: string;
  icon: AppIconName;
  href: Href;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/' },
  { key: 'quiz', label: 'Quiz', icon: 'quiz', href: '/quiz' },
  { key: 'review', label: 'Review', icon: 'refresh', href: '/review' },
  { key: 'settings', label: 'Settings', icon: 'settings', href: '/settings' },
];

// Screens where leaving through the nav would abandon work in progress.
// Their own header (with its exit confirmation) is the way out.
const HIDDEN_ON_PATHS = ['/quiz/session', '/review/session'];

const NAV_MAX_WIDTH = 560;
const MAX_FONT_SCALE = 1.3;

function getSectionForPath(pathname: string): NavKey | null {
  if (pathname === '/') return 'home';
  if (pathname === '/quiz' || pathname.startsWith('/quiz/')) return 'quiz';
  if (pathname === '/review' || pathname.startsWith('/review/')) return 'review';
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'settings';
  return null;
}

function useKeyboardVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // iOS fires the "will" events early enough to hide the bar before the keyboard animates in.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return isVisible;
}

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();

  if (isKeyboardVisible || HIDDEN_ON_PATHS.includes(pathname)) {
    return null;
  }

  const currentSection = getSectionForPath(pathname);

  const handleNavigate = (item: NavItem) => {
    if (item.key === currentSection) {
      // Already in this section; only jump back if we're on a nested screen.
      if (pathname !== item.href) {
        router.replace(item.href);
      }
      return;
    }

    if (item.key === 'home') {
      // Pop back to the existing Home screen instead of stacking a new one.
      router.dismissTo('/');
      return;
    }

    if (currentSection === 'home') {
      // Keep Home underneath so the back gesture returns to it.
      router.push(item.href);
      return;
    }

    // Switching between sections swaps the screen rather than growing history.
    router.replace(item.href);
  };

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}
      accessibilityRole="tablist"
    >
      <View style={[styles.bar, { paddingLeft: insets.left, paddingRight: insets.right }]}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === currentSection;

          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavigate(item)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
              hitSlop={4}
              style={({ pressed }) => [styles.item, pressed && !isActive && styles.itemPressed]}
            >
              {({ pressed }) => (
                <>
                  <View
                    style={[
                      styles.iconWrap,
                      isActive && styles.iconWrapActive,
                      pressed && !isActive && styles.iconWrapPressed,
                    ]}
                  >
                    <AppIcon
                      name={item.icon}
                      size={ICON_SIZES.lg}
                      color={isActive ? COLORS.primary : COLORS.textMuted}
                    />
                  </View>
                  <Text
                    style={[styles.label, isActive && styles.labelActive]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={MAX_FONT_SCALE}
                  >
                    {item.label}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const barShadow = createShadow(8, COLORS.accent, 0.06, 12, { width: 0, height: -4 });

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm - 2,
    ...barShadow,
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: NAV_MAX_WIDTH,
    alignSelf: 'center',
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: SPACING.xs,
  },
  itemPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 52,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.round,
  },
  iconWrapActive: {
    backgroundColor: COLORS.surfaceMuted,
  },
  iconWrapPressed: {
    backgroundColor: COLORS.surfacePressed,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textMuted,
  },
  labelActive: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
});
