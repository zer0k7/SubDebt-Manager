import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const CanaraLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#0072BB" />
      <G transform="translate(18, 18) scale(0.64)">
        <Path
          d="M 50 14 L 84 76 L 16 76 Z"
          stroke="#FFCC00"
          strokeWidth="10"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M 50 86 L 16 24 L 84 24 Z"
          stroke="#00C0F3"
          strokeWidth="10"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};
