import React from 'react';
import Svg, { Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const HdfcLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#FFFFFF" />
      <G transform="translate(14, 14) scale(0.72)">
        <Rect x="0" y="0" width="100" height="100" fill="#004C8F" rx="8" />
        <Rect x="0" y="0" width="28" height="28" fill="#ED232A" />
        <Rect x="72" y="0" width="28" height="28" fill="#ED232A" />
        <Rect x="0" y="72" width="28" height="28" fill="#ED232A" />
        <Rect x="72" y="72" width="28" height="28" fill="#ED232A" />
        <Rect x="28" y="28" width="44" height="44" fill="#FFFFFF" />
        <Rect x="38" y="38" width="24" height="24" fill="#004C8F" />
      </G>
    </Svg>
  );
};
