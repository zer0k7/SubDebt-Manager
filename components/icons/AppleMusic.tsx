import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const AppleMusicIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FA233B" />
        <Stop offset="100%" stopColor="#FB5C74" />
      </LinearGradient>
    </Defs>
    <Path
      d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"
      fill="url(#grad1)"
    />
    <Path
      d="M15.5 9c-.5 0-1.5.2-2 .5V6c0-.5-.5-.5-1-.5s-1 .2-1 .5v7c0 1.5-1 2-2 2-.5 0-1-.5-1-1s.5-1.5 1.5-1.5c.3 0 .5.2.5.5 0 .5.5.5 1 0 0-.8-.5-1.5-1.5-1.5-2 0-3 1.5-3 3s1.5 2.5 3.5 2.5c2 0 3.5-1 3.5-3V8c.5-.3 1-.5 1.5-.5.5 0 1 .5 1 1 0 .5-.5 1-1 1-.3 0-.5-.2-.5-.5 0-.5-.5-.5-1 0 0 .8.5 1.5 1.5 1.5 1.5 0 2.5-1 2.5-2s-1-2-2.5-2z"
      fill="white"
    />
  </Svg>
);
