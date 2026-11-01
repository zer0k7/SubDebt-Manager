import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';

export interface BankLogoProps {
  size?: number;
}

export const JkBankLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#FFFFFF" />
      <G transform="translate(10, 10) scale(0.8)">
        <Path
          d="M 18 16 C 26 12, 38 10, 48 24 C 40 30, 32 38, 30 46 C 24 44, 18 36, 14 26 C 14 20, 16 16, 18 16 Z"
          fill="#ED3823"
        />
        <Path
          d="M 52 24 C 62 10, 74 12, 82 16 C 84 16, 86 20, 86 26 C 82 36, 76 44, 70 46 C 68 38, 60 30, 52 24 Z"
          fill="#007BC3"
        />
        <Path
          d="M 28 50 C 34 52, 42 46, 50 36 C 58 46, 66 52, 72 50 C 66 68, 56 82, 50 86 C 44 82, 34 68, 28 50 Z"
          fill="#78BE20"
        />
        <Path
          d="M 50 30 C 46 36, 38 42, 32 44 C 36 38, 44 32, 50 26 C 56 32, 64 38, 68 44 C 62 42, 54 36, 50 30 Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
};
