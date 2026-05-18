// src/components/ui/ProgressStepper.tsx
// Horizontal workflow stepper matching Stitch design
// Shows active step with emerald circles and connecting lines

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from './theme';

interface Step {
  label: string;
  key: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
}

const defaultSteps: Step[] = [
  { key: 'understand', label: 'Understand' },
  { key: 'discover', label: 'Discover' },
  { key: 'rank', label: 'Rank' },
  { key: 'price', label: 'Price' },
  { key: 'book', label: 'Book' },
  { key: 'recover', label: 'Recover' },
  { key: 'evaluate', label: 'Evaluate' },
];

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps = defaultSteps,
  currentStep,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={step.key}>
            {index > 0 && (
              <View
                style={[
                  styles.line,
                  isCompleted ? styles.lineCompleted : styles.lineUpcoming,
                ]}
              />
            )}
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                  isUpcoming && styles.circleUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.number,
                      isActive && styles.numberActive,
                      isUpcoming && styles.numberUpcoming,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
};

export { defaultSteps };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  stepContainer: {
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  circleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleUpcoming: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  number: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  numberActive: {
    color: '#FFFFFF',
  },
  numberUpcoming: {
    color: colors.textMuted,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  labelCompleted: {
    color: colors.success,
    fontWeight: '600',
  },
  line: {
    height: 2,
    width: 20,
    marginTop: 17,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  lineUpcoming: {
    backgroundColor: colors.border,
    borderStyle: 'dashed',
  },
});

export default ProgressStepper;
