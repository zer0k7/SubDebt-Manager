import React from 'react';
import { View, StyleSheet } from 'react-native';
import { matchBank, INDIAN_BANKS } from './bankRegistry';
import { JkBankLogo } from './logos/JkBankLogo';
import { SbiLogo } from './logos/SbiLogo';
import { SliceLogo } from './logos/SliceLogo';
import { IppbLogo } from './logos/IppbLogo';
import { KotakLogo } from './logos/KotakLogo';
import { HdfcLogo } from './logos/HdfcLogo';
import { IciciLogo } from './logos/IciciLogo';
import { AxisLogo } from './logos/AxisLogo';
import { PnbLogo } from './logos/PnbLogo';
import { BobLogo } from './logos/BobLogo';
import { PaytmLogo } from './logos/PaytmLogo';
import { AirtelLogo } from './logos/AirtelLogo';
import { CanaraLogo } from './logos/CanaraLogo';
import { UnionBankLogo } from './logos/UnionBankLogo';
import { IndusIndLogo } from './logos/IndusIndLogo';
import { YesBankLogo } from './logos/YesBankLogo';
import { FederalBankLogo } from './logos/FederalBankLogo';
import { IdfcLogo } from './logos/IdfcLogo';
import { GenericBankLogo } from './logos/GenericBankLogo';

export interface BankLogoProps {
  name?: string;
  bankId?: string;
  size?: number;
  fallbackColor?: string;
  style?: any;
}

export const BankLogo: React.FC<BankLogoProps> = ({
  name,
  bankId,
  size = 32,
  fallbackColor = '#0284c7',
  style,
}) => {
  let resolvedId = bankId;

  if (!resolvedId && name) {
    const matched = matchBank(name);
    if (matched) {
      resolvedId = matched.id;
    }
  }

  const renderLogo = () => {
    switch (resolvedId) {
      case 'jk_bank':
        return <JkBankLogo size={size} />;
      case 'sbi':
        return <SbiLogo size={size} />;
      case 'slice':
        return <SliceLogo size={size} />;
      case 'ippb':
        return <IppbLogo size={size} />;
      case 'kotak':
        return <KotakLogo size={size} />;
      case 'hdfc':
        return <HdfcLogo size={size} />;
      case 'icici':
        return <IciciLogo size={size} />;
      case 'axis':
        return <AxisLogo size={size} />;
      case 'pnb':
        return <PnbLogo size={size} />;
      case 'bob':
        return <BobLogo size={size} />;
      case 'paytm':
        return <PaytmLogo size={size} />;
      case 'airtel':
        return <AirtelLogo size={size} />;
      case 'canara':
        return <CanaraLogo size={size} />;
      case 'union':
        return <UnionBankLogo size={size} />;
      case 'indusind':
        return <IndusIndLogo size={size} />;
      case 'yes':
        return <YesBankLogo size={size} />;
      case 'federal':
        return <FederalBankLogo size={size} />;
      case 'idfc':
        return <IdfcLogo size={size} />;
      default:
        return <GenericBankLogo size={size} color={fallbackColor} />;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {renderLogo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },
});
