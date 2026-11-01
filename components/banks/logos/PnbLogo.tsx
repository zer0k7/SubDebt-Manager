import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const PnbLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#F8B11B" />
      <G transform="translate(15, 15) scale(0.7)">
        <Circle cx="50" cy="50" r="44" fill="#781123" />
        <Path
          d="M 32 30 L 52 30 C 62 30, 68 36, 68 44 C 68 52, 62 58, 52 58 L 44 58 L 44 74 L 32 74 Z M 44 40 L 44 48 L 50 48 C 54 48, 56 46, 56 44 C 56 42, 54 40, 50 40 Z"
          fill="#F8B11B"
        />
      </G>
    </Svg>
  );
};
