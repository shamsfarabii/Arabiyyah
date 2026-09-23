import { SymbolView, type SymbolViewProps, type SymbolWeight } from 'expo-symbols';

import { COLORS } from '@/constants/theme';

export type AppIconName =
  | 'chevronLeft'
  | 'chevronRight'
  | 'arrowRight'
  | 'plus'
  | 'photo'
  | 'checkmarkCircle'
  | 'circle'
  | 'share'
  | 'importDoc'
  | 'trash'
  | 'xmark'
  | 'warning'
  | 'book'
  | 'refresh'
  | 'quiz'
  | 'eye'
  | 'minus'
  | 'clock'
  | 'settings'
  | 'home';

const ICON_NAMES: Record<AppIconName, SymbolViewProps['name']> = {
  chevronLeft: {
    ios: 'chevron.left',
    android: 'chevron_left',
    web: 'chevron_left',
  },
  chevronRight: {
    ios: 'chevron.right',
    android: 'chevron_right',
    web: 'chevron_right',
  },
  arrowRight: {
    ios: 'arrow.right',
    android: 'arrow_forward',
    web: 'arrow_forward',
  },
  plus: {
    ios: 'plus',
    android: 'add',
    web: 'add',
  },
  photo: {
    ios: 'photo.on.rectangle.angled',
    android: 'image',
    web: 'image',
  },
  checkmarkCircle: {
    ios: 'checkmark.circle.fill',
    android: 'check_circle',
    web: 'check_circle',
  },
  circle: {
    ios: 'circle',
    android: 'radio_button_unchecked',
    web: 'radio_button_unchecked',
  },
  share: {
    ios: 'square.and.arrow.up',
    android: 'share',
    web: 'share',
  },
  importDoc: {
    ios: 'square.and.arrow.down',
    android: 'download',
    web: 'download',
  },
  trash: {
    ios: 'trash',
    android: 'delete',
    web: 'delete',
  },
  xmark: {
    ios: 'xmark',
    android: 'close',
    web: 'close',
  },
  warning: {
    ios: 'exclamationmark.circle.fill',
    android: 'error',
    web: 'error',
  },
  book: {
    ios: 'book.closed.fill',
    android: 'menu_book',
    web: 'menu_book',
  },
  refresh: {
    ios: 'arrow.triangle.2.circlepath',
    android: 'autorenew',
    web: 'autorenew',
  },
  quiz: {
    ios: 'questionmark.bubble.fill',
    android: 'quiz',
    web: 'quiz',
  },
  eye: {
    ios: 'eye.fill',
    android: 'visibility',
    web: 'visibility',
  },
  minus: {
    ios: 'minus',
    android: 'remove',
    web: 'remove',
  },
  clock: {
    ios: 'clock',
    android: 'schedule',
    web: 'schedule',
  },
  home: {
    ios: 'house.fill',
    android: 'home',
    web: 'home',
  },
  settings: {
    ios: 'gearshape.fill',
    android: 'settings',
    web: 'settings',
  },
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  weight?: SymbolWeight;
};

export function AppIcon({
  name,
  size = 20,
  color = COLORS.text,
  weight = 'semibold',
}: AppIconProps) {
  return (
    <SymbolView
      name={ICON_NAMES[name]}
      size={size}
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
    />
  );
}
