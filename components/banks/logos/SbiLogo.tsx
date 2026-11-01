import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const SbiLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#FFFFFF" />
      <G transform="translate(6, 6) scale(0.88)">
        <Circle cx="50" cy="50" r="44" fill="#00A3E0" />
        <Circle cx="50" cy="46" r="14" fill="#FFFFFF" />
        <Rect x="46" y="46" width="8" height="48" fill="#FFFFFF" rx="1" />
      </G>
    </Svg>
  );
};
