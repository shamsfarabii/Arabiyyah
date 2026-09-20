import { Platform, type ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
  | 'elevation'
>;

export function createShadow(
  elevation = 2,
  shadowColor = '#000',
  shadowOpacity = 0.2,
  shadowRadius = elevation * 0.5,
  shadowOffset: { height: number; width: number } = {
    height: elevation * 0.5,
    width: 0,
  },
): ShadowStyle {
  return Platform.select({
    ios: {
      shadowColor,
      shadowOpacity,
      shadowRadius,
      shadowOffset,
    },
    android: {
      elevation,
    },
    default: {
      elevation,
    },
  }) as ShadowStyle;
}
