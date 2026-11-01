import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const IciciLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#8B1C24" />
      <G transform="translate(14, 14) scale(0.72)">
        <Circle cx="50" cy="50" r="42" stroke="#F58220" strokeWidth="12" fill="none" />
        <Circle cx="50" cy="30" r="7" fill="#FFFFFF" />
        <Path
          d="M 44 44 L 56 44 L 56 70 L 44 70 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M 50 14 C 65 14, 80 26, 82 44"
          stroke="#F58220"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};
