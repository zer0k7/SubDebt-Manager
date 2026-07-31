import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const DisneyIcon: React.FC<IconProps> = ({ size = 24, color = '#113CCF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="4" fill={color} />
    <Path
      d="M12 5c-2.5 0-4.5 2-5 4.5C6.5 12 8 14.5 10 15.5c.5.2 1 0 1-.5V11c0-.5-.5-1-1-1-.5 0-1 .5-1 1v3c-1-.5-1.5-2-1-3.5.3-1 1-2 2-2.5 1.5-.5 3 0 4 1 .5.5 1 1.5 1 2.5 0 2-1 3.5-2.5 4-.5.2-1 0-1-.5v-2c0-.5.5-1 1-1s1 .5 1 1v2.5c0 .5.5 1 1 .5 1.5-.5 3-2 3.5-4 .5-2.5-.5-5-3-6-.5-.3-1-.5-1.5-.5z"
      fill="white"
    />
  </Svg>
);
