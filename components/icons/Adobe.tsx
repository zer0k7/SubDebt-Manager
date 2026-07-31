import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const AdobeIcon: React.FC<IconProps> = ({ size = 24, color = '#FF0000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 2h7v20L15 2zM9 2H2v20L9 2zM12 9l5 13h-4l-1.5-4h-3L12 9z"
      fill={color}
    />
  </Svg>
);
