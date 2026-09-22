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
  | 'importDoc';

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
