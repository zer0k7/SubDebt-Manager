import React from 'react';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const ClaudeIcon: React.FC<IconProps> = ({ size = 24, color = '#D97757' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect width="24" height="24" rx="6" fill={color} />
    <SvgText x="12" y="16" fontSize="14" fontWeight="bold" fontFamily="serif" fill="#fff" textAnchor="middle">C</SvgText>
  </Svg>
);
