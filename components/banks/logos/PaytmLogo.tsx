import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const PaytmLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#FFFFFF" />
      <G transform="translate(14, 20) scale(0.72)">
        <Rect x="4" y="10" width="40" height="40" rx="8" fill="#002970" />
        <Rect x="48" y="10" width="40" height="40" rx="8" fill="#00BAF2" />
        <Path
          d="M 16 22 L 28 22 C 34 22, 36 26, 36 30 C 36 36, 32 38, 26 38 L 22 38 L 22 48 L 16 48 Z M 22 28 L 22 33 L 26 33 C 28 33, 30 32, 30 30 C 30 29, 29 28, 27 28 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 68 22 L 74 22 L 74 28 L 82 28 L 82 34 L 74 34 L 74 48 L 68 48 L 68 34 L 62 34 L 62 28 L 68 28 Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
};
