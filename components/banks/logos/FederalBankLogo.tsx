import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const FederalBankLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#003580" />
      <G transform="translate(18, 18) scale(0.64)">
        <Path
          d="M 50 14 L 82 26 L 82 56 C 82 72, 68 84, 50 88 C 32 84, 18 72, 18 56 L 18 26 Z"
          fill="#FFB81C"
        />
        <Path
          d="M 50 24 L 74 34 L 74 54 C 74 66, 64 76, 50 78 C 36 76, 26 66, 26 54 L 26 34 Z"
          fill="#003580"
        />
        <Path
          d="M 40 40 L 60 40 L 60 48 L 48 48 L 48 54 L 56 54 L 56 60 L 48 60 L 48 70 L 40 70 Z"
          fill="#FFB81C"
        />
      </G>
    </Svg>
  );
};
