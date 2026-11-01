import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const AxisLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#861F41" />
      <G transform="translate(16, 16) scale(0.68)">
        <Path
          d="M 50 10 L 88 84 L 58 84 L 50 64 L 42 84 L 12 84 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 50 36 L 60 60 L 40 60 Z"
          fill="#861F41"
        />
      </G>
    </Svg>
  );
};
