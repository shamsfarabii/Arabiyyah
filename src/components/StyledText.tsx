import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';

import {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '@/constants/theme';

type StyledTextProps = TextProps & {
  style?: StyleProp<TextStyle>;
};

export function Heading({ children, style, ...props }: StyledTextProps) {
  return (
    <Text style={[styles.heading, style]} {...props}>
      {children}
    </Text>
  );
}

export function Subheading({ children, style, ...props }: StyledTextProps) {
  return (
    <Text style={[styles.subheading, style]} {...props}>
      {children}
    </Text>
  );
}

export function BodyText({ children, style, ...props }: StyledTextProps) {
  return (
    <Text style={[styles.body, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.extraBold,
    color: COLORS.textDark,
    letterSpacing: -0.6,
  },
  subheading: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  body: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});

export const styledTextSpacing = {
  subtitle: {
    marginTop: SPACING.xs,
  },
  sectionDescription: {
    marginTop: 3,
  },
} as const;
