import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const SliceLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#8B19E6" />
      <G transform="translate(14, 25) scale(0.72)">
        <Path
          d="M 12 36 C 8 36, 4 33, 4 28 C 4 22, 10 20, 16 19 C 22 18, 24 16, 24 14 C 24 11, 20 9, 15 9 C 10 9, 6 12, 5 15 L 0 12 C 2 7, 8 4, 15 4 C 24 4, 30 8, 30 15 C 30 21, 24 23, 18 24 C 12 25, 10 27, 10 29 C 10 32, 14 33, 18 33 C 23 33, 27 30, 29 26 L 33 30 C 30 34, 24 36, 18 36 Z"
          fill="#FFFFFF"
        />
        <Rect x="36" y="2" width="6" height="34" rx="2" fill="#FFFFFF" />
        <Rect x="46" y="14" width="6" height="22" rx="2" fill="#FFFFFF" />
        <Path
          d="M 45 4 L 52 4 C 52 8, 48 10, 45 10 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 68 18 C 66 15, 62 14, 59 14 C 52 14, 48 20, 48 26 C 48 32, 53 36, 60 36 C 65 36, 68 33, 70 29 L 65 27 C 64 29, 62 31, 59 31 C 55 31, 53 28, 53 25 C 53 22, 55 19, 59 19 C 62 19, 64 21, 65 23 Z"
          fill="#FFFFFF"
          transform="translate(10, 0)"
        />
        <Path
          d="M 85 24 L 70 24 C 70 19, 74 15, 80 15 C 84 15, 87 18, 88 21 L 84 22 C 83 20, 81 18, 79 18 C 76 18, 74 20, 74 23 L 85 23 Z M 85 26 L 70 26 C 70 31, 74 35, 80 35 C 84 35, 87 33, 88 30 L 84 28 C 83 30, 81 32, 79 32 C 75 32, 74 29, 74 26 Z"
          fill="#FFFFFF"
          transform="translate(10, 0)"
        />
      </G>
    </Svg>
  );
};
