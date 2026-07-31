import { useTheme } from '../hooks/useTheme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, typography } from '../constants/typography';

type BadgeVariant = 'active' | 'expiring' | 'expired' | 'paid' | 'pending';

interface GlassBadgeProps {
  variant: BadgeVariant;
  text?: string;
  showIcon?: boolean;
}

interface VariantConfig {
  text: string;
  icon?: string;
}

const variantStyles: Record<BadgeVariant, VariantConfig> = {
  active: { text: 'Active' },
  expiring: { text: 'Expiring Soon' },
  expired: { text: 'Expired' },
  paid: { text: 'Paid', icon: 'checkmark' },
  pending: { text: 'Pending' },
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({ 
  variant, 
  text,
  showIcon = true,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const config = variantStyles[variant];
  const displayText = text || config.text;
  const variantStyle = styles[variant];

  return (
    <View style={[styles.badge, variantStyle]}>
      {showIcon && config.icon && (
        <Ionicons 
          name={config.icon as any} 
          size={12} 
          color={colors.status.paid.text} 
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: variantStyle.color as string }]}>{displayText}</Text>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  active: {
    backgroundColor: colors.status.active.bg,
    borderColor: colors.status.active.border,
    color: colors.status.active.text,
  },
  expiring: {
    backgroundColor: colors.status.expiring.bg,
    borderColor: colors.status.expiring.border,
    color: colors.status.expiring.text,
  },
  expired: {
    backgroundColor: colors.status.expired.bg,
    borderColor: colors.status.expired.border,
    color: colors.status.expired.text,
  },
  paid: {
    backgroundColor: colors.status.paid.bg,
    borderColor: colors.status.paid.border,
    color: colors.status.paid.text,
  },
  pending: {
    backgroundColor: colors.badge.glass,
    borderColor: colors.glass.cardBorder,
    color: colors.text.secondary,
  },
});
