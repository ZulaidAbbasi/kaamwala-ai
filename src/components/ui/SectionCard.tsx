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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  accentBar: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: spacing.lg + 2,
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
    marginBottom: spacing.md + 2,
  },
  headerText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.bodySm,
    marginTop: 3,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing.md,
  },
});

export default SectionCard;
