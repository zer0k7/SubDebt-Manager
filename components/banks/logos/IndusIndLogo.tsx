import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const IndusIndLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#841829" />
      <G transform="translate(18, 18) scale(0.64)">
        <Path
          d="M 20 54 C 24 38, 38 32, 54 32 C 60 26, 68 20, 78 18 C 76 26, 70 32, 66 36 C 76 40, 84 48, 84 62 C 84 76, 70 82, 54 82 C 34 82, 20 72, 20 54 Z M 34 54 C 34 64, 42 72, 54 72 C 64 72, 72 66, 72 58 C 72 50, 64 44, 52 44 C 42 44, 34 48, 34 54 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 68 24 C 64 30, 58 36, 52 38"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};
