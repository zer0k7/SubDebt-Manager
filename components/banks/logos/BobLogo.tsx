import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const BobLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#F26522" />
      <G transform="translate(18, 18) scale(0.64)">
        <Circle cx="50" cy="50" r="18" fill="#FFFFFF" />
        <Path
          d="M 50 14 L 50 26 M 50 74 L 50 86 M 14 50 L 26 50 M 74 50 L 86 50 M 24 24 L 32 32 M 68 68 L 76 76 M 24 76 L 32 68 M 68 32 L 76 24"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M 40 40 C 44 36, 52 36, 56 40 C 60 44, 60 48, 56 52 C 62 56, 62 62, 56 66 C 50 70, 42 70, 38 64"
          stroke="#F26522"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};
