import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const NotionIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 3.5L4 4v16l.5.5 4-1 3.5 3 .5.5.5-.5 3.5-3 4 1 .5-.5V4l-.5-.5-8 1.5-8-1.5zm8.5 2.5v14l-3-2.5V5.5l3 1.5zm4 12l-3 .5V6.5l3-.5v12.5z"
      fill={color}
    />
  </Svg>
);
