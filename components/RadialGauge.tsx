import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

interface RadialGaugeProps {
  percentage: number; // 0 to 100+
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  valueText: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  percentage,
  size = 75,
  strokeWidth = 6,
  color,
  label,
  valueText,
}) => {
  const { colors, isDark } = useTheme();
  
  const pct = Math.min(100, Math.max(0, percentage));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]} numberOfLines={1}>
        {label}
      </Text>
      
      <View style={styles.svgContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${center} ${center})`}
          />
          {/* Center text percentage */}
          <SvgText
            x={center}
            y={center + 4}
            fontSize="11"
            fontWeight="700"
            fill={colors.text.primary}
            textAnchor="middle"
          >
            {`${Math.round(percentage)}%`}
          </SvgText>
        </Svg>
      </View>

      <Text style={[styles.val, { color: colors.text.secondary }]} numberOfLines={1}>
        {valueText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flex: 1,
  },
  svgContainer: {
    marginVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  val: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
