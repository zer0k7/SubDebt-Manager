import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const MicrosoftIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="9" height="9" fill="#F25022" />
    <Rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
    <Rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
    <Rect x="13" y="13" width="9" height="9" fill="#FFB900" />
  </Svg>
);
