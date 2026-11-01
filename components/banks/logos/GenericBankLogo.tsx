import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BankLogoProps } from './JkBankLogo';

export interface GenericBankLogoProps extends BankLogoProps {
  color?: string;
}

export const GenericBankLogo: React.FC<GenericBankLogoProps> = ({ size = 32, color = '#0284c7' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Rect width="100" height="100" rx="22" fill={color} />
      <G transform="translate(18, 18) scale(0.64)">
        <Path
          d="M 50 14 L 84 32 L 16 32 Z"
          fill="#FFFFFF"
        />
        <Rect x="20" y="36" width="60" height="6" fill="#FFFFFF" rx="2" />
        <Rect x="24" y="46" width="8" height="26" fill="#FFFFFF" rx="2" />
        <Rect x="40" y="46" width="8" height="26" fill="#FFFFFF" rx="2" />
        <Rect x="52" y="46" width="8" height="26" fill="#FFFFFF" rx="2" />
        <Rect x="68" y="46" width="8" height="26" fill="#FFFFFF" rx="2" />
        <Rect x="16" y="76" width="68" height="8" fill="#FFFFFF" rx="2" />
      </G>
    </Svg>
  );
};
