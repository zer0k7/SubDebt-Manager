import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const NetflixIcon: React.FC<IconProps> = ({ size = 24, color = '#E50914' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.5 2L5.5 22C7.5 22 9 21.5 10.5 20.5L10.5 12L13.5 22C15.5 21.5 17 21 18.5 20.5L18.5 2C17 2.5 15.5 3 13.5 3.5L13.5 12L10.5 2C9 2.5 7.5 2.5 5.5 2Z"
      fill={color}
    />
  </Svg>
);
