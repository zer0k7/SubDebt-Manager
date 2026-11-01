import React from 'react';
import Svg, { Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export const IdfcLogo: React.FC<BankLogoProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill="#9E1B32" />
      <G transform="translate(20, 20) scale(0.6)">
        <Rect x="8" y="8" width="38" height="38" fill="#FFFFFF" rx="4" />
        <Rect x="54" y="8" width="38" height="38" fill="#F37021" rx="4" />
        <Rect x="8" y="54" width="38" height="38" fill="#F37021" rx="4" />
        <Rect x="54" y="54" width="38" height="38" fill="#FFFFFF" rx="4" />
      </G>
    </Svg>
  );
};
