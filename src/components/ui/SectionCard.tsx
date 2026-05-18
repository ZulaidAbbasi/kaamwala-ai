// src/components/ui/SectionCard.tsx
// White rounded card container matching Stitch design
// Supports title, subtitle, icon, badge, footer

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadows, spacing, typography } from './theme';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  accent?: 'default' | 'ai' | 'success' | 'warning' | 'error';
  noPadding?: boolean;
}

const accentColors = {
  default: 'transparent',
  ai: colors.tertiaryDark,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  children,
  badge,
  footer,
  accent = 'default',
  noPadding,
}) => {
  const showAccent = accent !== 'default';

  return (
    <View style={[styles.card, shadows.card]}>
      {showAccent && (
        <View style={[styles.accentBar, { backgroundColor: accentColors[accent] }]} />
      )}
      <View style={[styles.content, showAccent && styles.contentAccented, noPadding && styles.noPadding]}>
        {(title || badge) && (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {badge}
          </View>
        )}
        {children}
        {footer && (
          <>
            <View style={styles.divider} />
            {footer}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  contentAccented: {
    paddingLeft: spacing.md,
  },
  noPadding: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.headlineSm,
  },
  subtitle: {
    ...typography.bodySm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
});

export default SectionCard;
