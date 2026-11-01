import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const UnionBankLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#FFFFFF" />
      <G transform="translate(16, 16) scale(0.68)">
        <Path
          d="M 24 20 L 24 54 C 24 68, 36 78, 50 78 C 64 78, 76 68, 76 54 L 76 20 L 64 20 L 64 54 C 64 62, 58 66, 50 66 C 42 66, 36 62, 36 54 L 36 20 Z"
          fill="#E31E24"
        />
        <Path
          d="M 12 34 L 12 60 C 12 76, 26 88, 44 88 C 54 88, 62 84, 68 76 L 58 70 C 54 74, 48 76, 44 76 C 32 76, 24 68, 24 58 L 24 34 Z"
          fill="#0054A6"
        />
      </G>
    </Svg>
  );
};
