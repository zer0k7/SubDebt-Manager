import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const GoogleOneIcon: React.FC<IconProps> = ({ size = 24, color = '#4285F4' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#F1F3F4" />
    <Path
      d="M12 6v12M8 8l4-2 4 2M8 16l4 2 4-2"
      stroke="#4285F4"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M12 8c-2 0-4 1.5-4 4s2 4 4 4"
      stroke="#EA4335"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M12 8c2 0 4 1.5 4 4s-2 4-4 4"
      stroke="#34A853"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M12 12c-1 0-2 .5-2 1.5s1 1.5 2 1.5"
      stroke="#FBBC05"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M12 12c1 0 2 .5 2 1.5s-1 1.5-2 1.5"
      stroke="#4285F4"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);
