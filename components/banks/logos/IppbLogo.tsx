import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const IppbLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#4A1521" />
      <G transform="translate(10, 10) scale(0.8)">
        <Circle cx="50" cy="54" r="32" fill="#D92429" />
        <Path
          d="M 12 72 Q 32 70 42 64 Q 58 54 86 28"
          stroke="#F8BE14"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 18 64 Q 38 62 48 56 Q 64 46 90 20"
          stroke="#F8BE14"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 24 56 Q 44 54 54 48 Q 70 38 94 14"
          stroke="#F8BE14"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
};
