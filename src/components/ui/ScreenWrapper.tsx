// src/components/ui/ScreenWrapper.tsx
// Consistent screen wrapper with SafeArea, ScrollView, and background color

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scroll = true,
  padded = true,
}) => {
  const content = (
    <View style={[styles.inner, padded && styles.padded]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
});

export default ScreenWrapper;
