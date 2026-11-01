import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const KotakLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#FFFFFF" />
      <G transform="translate(6, 12) scale(0.88)">
        <Rect x="2" y="10" width="84" height="56" rx="28" fill="#0C346B" />
        <Path
          d="M 30 26 C 22 26 18 31 18 38 C 18 45 22 50 30 50 C 37 50 42 44 46 38 C 42 32 37 26 30 26 Z M 30 32 C 34 32 37 35 39 38 C 37 41 34 44 30 44 C 26 44 24 41 24 38 C 24 35 26 32 30 32 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 58 26 C 51 26 46 32 42 38 C 46 44 51 50 58 50 C 66 50 70 45 70 38 C 70 31 66 26 58 26 Z M 58 32 C 62 32 64 35 64 38 C 64 41 62 44 58 44 C 54 44 51 41 49 38 C 51 35 54 32 58 32 Z"
          fill="#FFFFFF"
        />
        <Rect x="41" y="20" width="6" height="36" fill="#ED1C24" rx="2" />
      </G>
    </Svg>
  );
};
