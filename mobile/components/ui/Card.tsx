import React, { ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outlined' | 'elevated';
}

export default function Card({
  children,
  title,
  style,
  contentStyle,
  variant = 'default',
}: CardProps) {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

interface CardSectionProps {
  children: ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function CardSection({ children, title, style }: CardSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  default: {
    backgroundColor: COLORS.card,
  },
  outlined: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    backgroundColor: COLORS.card,
    ...SHADOWS.medium
  },
  titleContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textDark,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
});