import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const AirtelLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#E40000" />
      <G transform="translate(18, 18) scale(0.64)">
        <Path
          d="M 50 16 C 30 16, 20 30, 20 50 C 20 70, 32 84, 52 84 C 68 84, 80 72, 80 54 C 80 40, 70 32, 58 32 C 44 32, 36 42, 36 54 C 36 64, 42 70, 50 70 C 56 70, 62 66, 64 60 L 72 64 C 68 74, 58 80, 48 80 C 34 80, 24 70, 24 52 C 24 32, 36 20, 52 20 C 68 20, 84 32, 84 54 C 84 76, 68 90, 50 90 C 26 90, 14 72, 14 50 C 14 26, 28 10, 50 10 Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
};
