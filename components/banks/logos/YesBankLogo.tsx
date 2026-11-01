import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const YesBankLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#0B4EA2" />
      <G transform="translate(16, 16) scale(0.68)">
        <Path
          d="M 20 54 L 38 72 L 80 24 L 68 16 L 38 52 L 28 42 Z"
          fill="#ED1C24"
        />
        <Path
          d="M 16 54 L 38 76 L 84 22 L 76 16 L 38 60 L 24 46 Z"
          fill="#FFFFFF"
        />
      </G>
    </Svg>
  );
};
