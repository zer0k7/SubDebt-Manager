import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const SpotifyIcon: React.FC<IconProps> = ({ size = 24, color = '#1DB954' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path
      d="M17.5 10.5c-2.5-1.5-6.5-1.5-9-.5-.5.2-.5-.2-.5-.5 0-.3.2-.5.5-.5 3-1 7.5-.5 10.5 1 .3.2.5.5.3.8-.2.2-.5.2-.8.2z"
      fill="black"
    />
    <Path
      d="M17 13.5c-2-1-5-1.5-7.5-.5-.3.2-.5 0-.5-.3 0-.2.2-.5.5-.5 2.5-1 6-.5 8.5.5.2.2.3.5.2.7-.2.3-.4.3-.7.3z"
      fill="black"
    />
    <Path
      d="M16.5 16.5c-1.5-.8-4-1.2-6-.5-.3 0-.5-.2-.5-.5 0-.2.2-.4.5-.5 2-.8 4.5-.5 6.5.5.2.2.3.4.2.6-.2.2-.4.3-.7.4z"
      fill="black"
    />
  </Svg>
);
