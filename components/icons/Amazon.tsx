import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const AmazonIcon: React.FC<IconProps> = ({ size = 24, color = '#FF9900' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 17c-1.5.8-3.5 1.5-5.5 1.5-4 0-7-2.5-7-6 0-3.5 3-6 7-6s7 2.5 7 6c0 .5-.5 1-1 1s-1-.5-1-1c0-2.5-2-4.5-5-4.5S6 10 6 12.5c0 2.5 2 4.5 5 4.5 1.5 0 3-.5 4-1 .5-.2 1 0 1 .5 0 .5 0 .5-.5.5z"
      fill={color}
    />
    <Path
      d="M18 15c1.5 1 2.5 2 2.5 3.5 0 1-.5 1.5-1 1.5s-1-.5-1.5-1c-.5-.5-1-1-1.5-1.5"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
  </Svg>
);
